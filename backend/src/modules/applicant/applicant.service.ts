import { prisma } from '../../db/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
    CreateProfileInput,
    UpdateProfileInput,
    SubmitApplicationInput,
} from './applicant.schema.js';
import { evaluationQueue } from '../../queues/queue.config.js';
import { coordinatorAgent } from '../../agents/coordinator.agent.js';

export class ApplicantService {
    async getProfiles(userId: string) {
        return prisma.applicantProfile.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { applications: true },
                },
            },
        });
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
                    'Free plan accounts are limited to 1 active profile. Upgrade to Pro for multi-profile personas (e.g. Data Engineer, Pen Tester, Legal Counsel).'
                );
            }
        }

        return prisma.applicantProfile.create({
            data: {
                userId,
                title: input.title,
                resumeUrl: input.resumeUrl,
                summary: input.summary,
                skills: input.skills,
                metadata: input.metadata,
            },
        });
    }

    async upgradeToPro(userId: string) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                subscriptionTier: 'PRO',
                subscriptionExpiresAt: new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000
                ), // 30 days
            },
            select: {
                id: true,
                email: true,
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
            throw new AppError(404, 'Profile not found or access denied');
        }

        return prisma.applicantProfile.update({
            where: { id: profileId },
            data: {
                title: input.title,
                resumeUrl: input.resumeUrl,
                summary: input.summary,
                skills: input.skills,
                metadata: input.metadata,
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
            throw new AppError(404, 'Profile not found or access denied');
        }

        if (profile.applications.length > 0) {
            throw new AppError(
                400,
                'Cannot delete profile with active or pending job evaluations'
            );
        }

        await prisma.applicantProfile.delete({
            where: { id: profileId },
        });

        return { message: 'Profile deleted successfully' };
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
                'Selected profile not found or does not belong to you'
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
    // Vault Education
    async getVaultEducations(userId: string) {
        return prisma.vaultEducation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addVaultEducation(
        userId: string,
        data: {
            degree: string;
            institution: string;
            field: string;
            startDate?: string;
            endDate?: string;
        }
    ) {
        return prisma.vaultEducation.create({ data: { ...data, userId } });
    }

    // Vault Projects (with multiple narrative angles)
    async getVaultProjects(userId: string) {
        return prisma.vaultProject.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addVaultProject(
        userId: string,
        data: {
            title: string;
            projectUrl?: string;
            date?: string;
            tags: string[];
            narratives: { label: string; text: string }[];
        }
    ) {
        return prisma.vaultProject.create({ data: { ...data, userId } });
    }

    // Vault Experiences
    async getVaultExperiences(userId: string) {
        return prisma.vaultExperience.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addVaultExperience(
        userId: string,
        data: {
            company: string;
            role: string;
            location?: string;
            startDate: string;
            endDate?: string;
            highlights: string[];
        }
    ) {
        return prisma.vaultExperience.create({ data: { ...data, userId } });
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
