import { prisma } from '../../db/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
    CreateProfileInput,
    UpdateProfileInput,
    SubmitApplicationInput,
    AddEducationInput,
    AddExperienceInput,
    AddProjectInput,
    AddCertificationInput,
    AddVolunteeringInput,
    AddLanguageInput,
    AddLinkInput,
    UpgradePlanInput,
} from './applicant.schema.js';
import { evaluationQueue } from '../../queues/queue.config.js';
import { coordinatorAgent } from '../../agents/coordinator.agent.js';

function extractLegacyProjectIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((entry) => {
        if (typeof entry === 'string') return [entry];
        if (
            entry &&
            typeof entry === 'object' &&
            'projectId' in entry &&
            typeof entry.projectId === 'string'
        ) {
            return [entry.projectId];
        }
        return [];
    });
}

export class ApplicantService {
    async getProfiles(userId: string) {
        const profiles = await prisma.applicantProfile.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { applications: true },
                },
            },
        });

        return profiles.map((profile) => ({
            ...profile,
            selectedProjectIds:
                profile.selectedProjectIds.length > 0 ?
                    profile.selectedProjectIds
                :   extractLegacyProjectIds(profile.selectedProjectAngles),
        }));
    }

    async createProfile(userId: string, input: CreateProfileInput) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { subscriptionTier: true },
        });

        if (!user) {
            throw new AppError(404, 'User not found');
        }

        if (user.subscriptionTier === 'FREE') {
            const existingProfilesCount = await prisma.applicantProfile.count({
                where: { userId },
            });

            if (existingProfilesCount >= 1) {
                throw new AppError(
                    403,
                    'Free plan accounts are limited to 1 active resume. Upgrade to Pro to build a tailored resume for every role.'
                );
            }
        }

        return prisma.applicantProfile.create({
            data: {
                userId,
                title: input.title,
                resumeUrl: input.resumeUrl || null,
                summary: input.summary,
                skills: input.skills,
                selectedEducationIds: input.selectedEducationIds,
                selectedExperienceIds: input.selectedExperienceIds,
                selectedProjectIds: input.selectedProjectIds,
                selectedCertificationIds: input.selectedCertificationIds,
                selectedLinkIds: input.selectedLinkIds,
                selectedVolunteeringIds: input.selectedVolunteeringIds,
                selectedLanguageIds: input.selectedLanguageIds,
            },
        });
    }

    async upgradeToPro(userId: string, months: UpgradePlanInput['months']) {
        const current = await prisma.user.findUnique({
            where: { id: userId },
            select: { subscriptionExpiresAt: true },
        });

        if (!current) {
            throw new AppError(404, 'User not found');
        }

        const now = new Date();
        const base =
            current.subscriptionExpiresAt &&
            current.subscriptionExpiresAt > now ?
                current.subscriptionExpiresAt
            :   now;

        const subscriptionExpiresAt = new Date(base);
        subscriptionExpiresAt.setMonth(
            subscriptionExpiresAt.getMonth() + months
        );

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                subscriptionTier: 'PRO',
                subscriptionExpiresAt,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                middleName: true,
                lastName: true,
                phone: true,
                wilaya: true,
                companyName: true,
                role: true,
                subscriptionTier: true,
                subscriptionExpiresAt: true,
            },
        });

        return user;
    }

    async updateProfile(
        userId: string,
        profileId: string,
        input: UpdateProfileInput
    ) {
        const profile = await prisma.applicantProfile.findFirst({
            where: { id: profileId, userId },
        });

        if (!profile) {
            throw new AppError(404, 'Resume not found or access denied');
        }

        return prisma.applicantProfile.update({
            where: { id: profileId },
            data: {
                title: input.title,
                resumeUrl: input.resumeUrl === '' ? null : input.resumeUrl,
                summary: input.summary,
                skills: input.skills,
                selectedEducationIds: input.selectedEducationIds,
                selectedExperienceIds: input.selectedExperienceIds,
                selectedProjectIds: input.selectedProjectIds,
                selectedCertificationIds: input.selectedCertificationIds,
                selectedLinkIds: input.selectedLinkIds,
                selectedVolunteeringIds: input.selectedVolunteeringIds,
                selectedLanguageIds: input.selectedLanguageIds,
            },
        });
    }

    async deleteProfile(userId: string, profileId: string) {
        const profile = await prisma.applicantProfile.findFirst({
            where: { id: profileId, userId },
            include: {
                applications: {
                    where: {
                        status: {
                            in: [
                                'SUBMITTED',
                                'EVALUATING',
                                'INTERVIEW_PENDING',
                            ],
                        },
                    },
                },
            },
        });

        if (!profile) {
            throw new AppError(404, 'Resume not found or access denied');
        }

        if (profile.applications.length > 0) {
            throw new AppError(
                400,
                'Cannot delete a resume with active or pending job evaluations'
            );
        }

        await prisma.applicantProfile.delete({
            where: { id: profileId },
        });

        return { message: 'Resume deleted successfully' };
    }

    async submitApplication(userId: string, input: SubmitApplicationInput) {
        const position = await prisma.position.findUnique({
            where: { id: input.positionId },
        });

        if (!position) {
            throw new AppError(404, 'Position not found');
        }

        if (position.status !== 'OPEN') {
            throw new AppError(
                400,
                'This position is closed to new applicants'
            );
        }

        if (new Date() >= new Date(position.deadline)) {
            throw new AppError(
                400,
                'The application deadline for this position has passed'
            );
        }

        const profile = await prisma.applicantProfile.findFirst({
            where: { id: input.profileId, userId },
        });

        if (!profile) {
            throw new AppError(
                404,
                'Selected resume not found or does not belong to you'
            );
        }

        const existingApplication = await prisma.application.findUnique({
            where: {
                positionId_applicantId: {
                    positionId: input.positionId,
                    applicantId: userId,
                },
            },
        });

        if (existingApplication) {
            throw new AppError(
                409,
                'You have already applied to this position'
            );
        }

        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const anonymousId = `DZ-${randomSuffix}`;

        const application = await prisma.application.create({
            data: {
                positionId: input.positionId,
                applicantId: userId,
                profileId: input.profileId,
                anonymousId,
                status: 'SUBMITTED',
            },
            include: {
                position: {
                    select: {
                        title: true,
                        companyName: true,
                        deadline: true,
                    },
                },
                profile: {
                    select: {
                        title: true,
                    },
                },
            },
        });
        await evaluationQueue.add('evaluate-application', {
            applicationId: application.id,
        });

        return application;
    }

    async getMyApplications(userId: string) {
        return prisma.application.findMany({
            where: { applicantId: userId },
            orderBy: { appliedAt: 'desc' },
            include: {
                position: {
                    select: {
                        id: true,
                        title: true,
                        companyName: true,
                        location: true,
                        deadline: true,
                        status: true,
                    },
                },
                profile: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                interviewEvent: {
                    select: {
                        id: true,
                        status: true,
                        confirmedStart: true,
                        confirmedEnd: true,
                        meetingLink: true,
                    },
                },
            },
        });
    }
    async getVault(userId: string) {
        const [
            education,
            experience,
            projects,
            certifications,
            volunteering,
            languages,
            links,
        ] = await Promise.all([
            prisma.vaultEducation.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.vaultExperience.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.vaultProject.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.vaultCertification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.vaultVolunteering.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.vaultLanguage.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.vaultLink.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return {
            education,
            experience,
            projects,
            certifications,
            volunteering,
            languages,
            links,
        };
    }

    async getVaultEducations(userId: string) {
        return prisma.vaultEducation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addVaultEducation(userId: string, data: AddEducationInput) {
        return prisma.vaultEducation.create({ data: { ...data, userId } });
    }

    async deleteVaultEducation(userId: string, id: string) {
        const result = await prisma.vaultEducation.deleteMany({
            where: { id, userId },
        });
        if (result.count === 0) {
            throw new AppError(404, 'Education entry not found');
        }
        return { message: 'Education entry removed' };
    }

    async getVaultProjects(userId: string) {
        return prisma.vaultProject.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addVaultProject(userId: string, data: AddProjectInput) {
        return prisma.vaultProject.create({
            data: {
                userId,
                title: data.title,
                projectUrl: data.projectUrl || null,
                description: data.description || null,
                date: data.date,
                tags: data.tags,
                narratives:
                    data.description ?
                        [{ label: 'Overview', text: data.description }]
                    :   [],
            },
        });
    }

    async deleteVaultProject(userId: string, id: string) {
        const result = await prisma.vaultProject.deleteMany({
            where: { id, userId },
        });
        if (result.count === 0) {
            throw new AppError(404, 'Project not found');
        }
        return { message: 'Project removed' };
    }

    async getVaultExperiences(userId: string) {
        return prisma.vaultExperience.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addVaultExperience(userId: string, data: AddExperienceInput) {
        return prisma.vaultExperience.create({ data: { ...data, userId } });
    }

    async deleteVaultExperience(userId: string, id: string) {
        const result = await prisma.vaultExperience.deleteMany({
            where: { id, userId },
        });
        if (result.count === 0) {
            throw new AppError(404, 'Experience entry not found');
        }
        return { message: 'Experience entry removed' };
    }

    async addVaultCertification(
        userId: string,
        data: AddCertificationInput
    ) {
        return prisma.vaultCertification.create({
            data: { ...data, userId },
        });
    }

    async deleteVaultCertification(userId: string, id: string) {
        const result = await prisma.vaultCertification.deleteMany({
            where: { id, userId },
        });
        if (result.count === 0) {
            throw new AppError(404, 'Certification not found');
        }
        return { message: 'Certification removed' };
    }

    async addVaultVolunteering(
        userId: string,
        data: AddVolunteeringInput
    ) {
        return prisma.vaultVolunteering.create({
            data: { ...data, userId },
        });
    }

    async deleteVaultVolunteering(userId: string, id: string) {
        const result = await prisma.vaultVolunteering.deleteMany({
            where: { id, userId },
        });
        if (result.count === 0) {
            throw new AppError(404, 'Volunteering entry not found');
        }
        return { message: 'Volunteering entry removed' };
    }

    async addVaultLanguage(userId: string, data: AddLanguageInput) {
        return prisma.vaultLanguage.create({
            data: { ...data, userId },
        });
    }

    async deleteVaultLanguage(userId: string, id: string) {
        const result = await prisma.vaultLanguage.deleteMany({
            where: { id, userId },
        });
        if (result.count === 0) {
            throw new AppError(404, 'Language not found');
        }
        return { message: 'Language removed' };
    }

    async addVaultLink(userId: string, data: AddLinkInput) {
        return prisma.vaultLink.create({
            data: { ...data, userId },
        });
    }

    async deleteVaultLink(userId: string, id: string) {
        const result = await prisma.vaultLink.deleteMany({
            where: { id, userId },
        });
        if (result.count === 0) {
            throw new AppError(404, 'Link not found');
        }
        return { message: 'Link removed' };
    }
}

export class ApplicantServiceExtensions {
    async getCalendarEvents(userId: string) {
        const interviews = await prisma.interviewEvent.findMany({
            where: { applicantId: userId },
            include: {
                application: {
                    select: {
                        id: true,
                        anonymousId: true,
                        status: true,
                        position: {
                            select: {
                                title: true,
                                companyName: true,
                                location: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return interviews;
    }

    async selectInterviewRange(
        userId: string,
        interviewEventId: string,
        selectedStart: string,
        selectedEnd: string
    ) {
        const event = await prisma.interviewEvent.findFirst({
            where: { id: interviewEventId, applicantId: userId },
            include: { application: true },
        });

        if (!event) {
            throw new AppError(404, 'Interview event not found');
        }

        if (event.status === 'SLOT_CONFIRMED') {
            throw new AppError(400, 'Interview slot is already confirmed');
        }

        const coordination = await coordinatorAgent.confirmSlot(
            event.applicationId,
            selectedStart,
            selectedEnd,
            event.application.anonymousId
        );

        const updated = await prisma.interviewEvent.update({
            where: { id: interviewEventId },
            data: {
                status: 'SLOT_CONFIRMED',
                confirmedStart: new Date(selectedStart),
                confirmedEnd: new Date(selectedEnd),
                meetingLink: coordination.confirmedSlot?.meetingLocation,
                unmaskedAt: new Date(),
            },
        });

        await prisma.application.update({
            where: { id: event.applicationId },
            data: { status: 'INTERVIEW_SCHEDULED' },
        });

        return updated;
    }

    async getProInsights(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { subscriptionTier: true },
        });

        if (!user) {
            throw new AppError(404, 'User not found');
        }

        if (
            user.subscriptionTier !== 'PRO' &&
            user.subscriptionTier !== 'ENTERPRISE'
        ) {
            throw new AppError(
                403,
                'Personalized Cross-Round Insights are exclusive to Pro subscribers. Upgrade to unlock analytics across your application history.'
            );
        }

        const applications = await prisma.application.findMany({
            where: { applicantId: userId },
            include: {
                position: {
                    select: {
                        department: true,
                        title: true,
                    },
                },
            },
        });

        const totalApplications = applications.length;
        if (totalApplications === 0) {
            return {
                totalEvaluations: 0,
                averageMatchScore: 0,
                recurrentGaps: [],
                departmentBenchmarks: {},
                recommendations: [
                    'Submit applications to populate personalized cohort telemetry.',
                ],
            };
        }

        let totalScore = 0;
        const missingSkillsTally: Record<string, number> = {};
        const departmentScores: Record<
            string,
            { total: number; count: number }
        > = {};

        applications.forEach((app) => {
            const score = app.matchScore ?? 0;
            totalScore += score;

            const dept = app.position.department;
            if (!departmentScores[dept]) {
                departmentScores[dept] = { total: 0, count: 0 };
            }
            departmentScores[dept].total += score;
            departmentScores[dept].count += 1;

            if (app.gapAnalysis) {
                const gap = app.gapAnalysis as any;
                if (Array.isArray(gap.unmetMandatoryReasons)) {
                    gap.unmetMandatoryReasons.forEach((reason: string) => {
                        const skill = reason
                            .replace('Missing mandatory requirement: ', '')
                            .trim();
                        missingSkillsTally[skill] =
                            (missingSkillsTally[skill] || 0) + 1;
                    });
                }
            }
        });

        const recurrentGaps = Object.entries(missingSkillsTally)
            .map(([skill, frequency]) => ({
                skill,
                frequency,
                impactPercentage: Math.round(
                    (frequency / totalApplications) * 100
                ),
            }))
            .sort((a, b) => b.frequency - a.frequency);

        const departmentBenchmarks: Record<string, number> = {};
        Object.entries(departmentScores).forEach(([dept, data]) => {
            departmentBenchmarks[dept] = Math.round(data.total / data.count);
        });

        const recommendations: string[] = [];
        if (recurrentGaps.length > 0) {
            recommendations.push(
                `High Priority: ${recurrentGaps[0].skill} was requested in ${recurrentGaps[0].impactPercentage}% of your cohorts.`
            );
        }

        const bestDept = Object.entries(departmentBenchmarks).sort(
            (a, b) => b[1] - a[1]
        )[0];
        if (bestDept) {
            recommendations.push(
                `Your highest evidence conversion rate is in ${bestDept[0]} (${bestDept[1]}% average match).`
            );
        }

        return {
            totalEvaluations: totalApplications,
            averageMatchScore: Math.round(totalScore / totalApplications),
            recurrentGaps,
            departmentBenchmarks,
            recommendations,
        };
    }
}

export const applicantServiceExtensions = new ApplicantServiceExtensions();

export const applicantService = new ApplicantService();
