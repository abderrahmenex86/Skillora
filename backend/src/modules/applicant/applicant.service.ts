import { Prisma } from '@prisma/client';
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
    AddVaultEntryInput,
} from './applicant.schema.js';
import { enqueueEvaluation } from '../../queues/queue.config.js';
import { coordinatorAgent } from '../../agents/coordinator.agent.js';
import { agentOrchestrator } from '../../agents/orchestrator.js';
import {
    createApplicantMessage,
    notifyApplicationStatus,
} from '../../services/messages.js';
import { promoteNextOnHold } from '../../services/interview-scheduling.js';

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
                                'ON_HOLD',
                                'INTERVIEW_PENDING',
                                'INTERVIEW_SCHEDULED',
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
            include: {
                company: {
                    select: { status: true },
                },
            },
        });

        if (!position) {
            throw new AppError(404, 'Position not found');
        }

        if (!position.company || position.company.status !== 'APPROVED') {
            throw new AppError(
                400,
                'This position is not accepting applications'
            );
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
        await notifyApplicationStatus(application.id, 'SUBMITTED');

        const queued = await enqueueEvaluation(application.id);

        if (!queued) {
            // Redis is optional in local development. Run the evaluation in the
            // background so the application still progresses without a queue.
            void agentOrchestrator
                .evaluateApplication(application.id)
                .catch((error) => {
                    console.error(
                        `[applicant] Inline evaluation failed for ${application.id}:`,
                        error
                    );
                });
        }

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
                        meetingPayload: true,
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
            entries,
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
            prisma.vaultEntry.findMany({
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
            entries,
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

    async addVaultEntry(userId: string, data: AddVaultEntryInput) {
        return prisma.vaultEntry.create({
            data: {
                userId,
                section: data.section,
                title: data.title,
                subtitle: data.subtitle || null,
                description: data.description || null,
                date: data.date || null,
                endDate: data.endDate || null,
                url: data.url || null,
                tags: data.tags,
            },
        });
    }

    async deleteVaultEntry(userId: string, id: string) {
        const result = await prisma.vaultEntry.deleteMany({
            where: { id, userId },
        });
        if (result.count === 0) {
            throw new AppError(404, 'Information entry not found');
        }
        return { message: 'Information entry removed' };
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
                meetingPayload:
                    (coordination.meetingPayload as
                        | Prisma.InputJsonValue
                        | undefined) ?? undefined,
                unmaskedAt: new Date(),
            },
        });

        await prisma.application.update({
            where: { id: event.applicationId },
            data: { status: 'INTERVIEW_SCHEDULED' },
        });

        await createApplicantMessage({
            userId,
            applicationId: event.applicationId,
            kind: 'INTERVIEW_SCHEDULED',
            title: 'Interview confirmed',
            body: `Your interview is confirmed for ${new Date(selectedStart).toLocaleString()}. Meeting details are available in your dashboard.`,
        });

        return updated;
    }

    async getInterviewOptions(userId: string, eventId: string) {
        const event = await prisma.interviewEvent.findFirst({
            where: { id: eventId, applicantId: userId },
            include: {
                application: {
                    select: { id: true, positionId: true },
                },
            },
        });

        if (!event) {
            throw new AppError(404, 'Interview event not found');
        }

        const options = await coordinatorAgent.getAvailableSlots(
            event.application.positionId,
            event.applicationId
        );
        const currentStart = event.confirmedStart?.toISOString();

        return options.filter(
            (option) => option.startTime !== currentStart
        );
    }

    async rescheduleInterview(
        userId: string,
        eventId: string,
        selectedStart: string,
        selectedEnd: string
    ) {
        const event = await prisma.interviewEvent.findFirst({
            where: { id: eventId, applicantId: userId },
            include: {
                application: {
                    select: {
                        id: true,
                        positionId: true,
                        anonymousId: true,
                    },
                },
            },
        });

        if (!event) {
            throw new AppError(404, 'Interview event not found');
        }

        if (event.status === 'CANCELED') {
            throw new AppError(400, 'This interview has already been declined');
        }

        const options = await coordinatorAgent.getAvailableSlots(
            event.application.positionId,
            event.applicationId
        );
        const available = options.some(
            (option) =>
                option.startTime === selectedStart &&
                option.endTime === selectedEnd
        );

        if (!available) {
            throw new AppError(
                400,
                'That interview slot is no longer available. Choose another slot.'
            );
        }

        const confirmation = await coordinatorAgent.confirmSlot(
            event.applicationId,
            selectedStart,
            selectedEnd,
            event.application.anonymousId
        );

        const updated = await prisma.interviewEvent.update({
            where: { id: eventId },
            data: {
                status: 'SLOT_CONFIRMED',
                confirmedStart: new Date(selectedStart),
                confirmedEnd: new Date(selectedEnd),
                meetingLink:
                    confirmation.confirmedSlot?.meetingLocation ??
                    event.meetingLink,
                meetingPayload:
                    (confirmation.meetingPayload as any) ?? undefined,
                unmaskedAt: new Date(),
            },
        });

        await prisma.application.update({
            where: { id: event.applicationId },
            data: { status: 'INTERVIEW_SCHEDULED' },
        });

        await createApplicantMessage({
            userId,
            applicationId: event.applicationId,
            kind: 'INTERVIEW_RESCHEDULED',
            title: 'Interview rescheduled',
            body: `Your interview is now scheduled for ${new Date(
                selectedStart
            ).toLocaleString('en-GB', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Africa/Algiers',
            })}. The meeting details are available in your dashboard.`,
        });

        return updated;
    }

    async declineInterview(userId: string, eventId: string) {
        const event = await prisma.interviewEvent.findFirst({
            where: { id: eventId, applicantId: userId },
            include: {
                application: {
                    select: { id: true, positionId: true },
                },
            },
        });

        if (!event) {
            throw new AppError(404, 'Interview event not found');
        }

        if (event.status === 'CANCELED') {
            throw new AppError(400, 'This interview has already been declined');
        }

        await prisma.interviewEvent.update({
            where: { id: eventId },
            data: { status: 'CANCELED' },
        });

        await prisma.application.update({
            where: { id: event.applicationId },
            data: { status: 'DECLINED' },
        });

        await createApplicantMessage({
            userId,
            applicationId: event.applicationId,
            kind: 'DECLINED',
            title: 'Interview declined',
            body: 'You declined this interview offer. Your application is now closed for this position.',
        });

        const promotion = await promoteNextOnHold(
            event.application.positionId
        );

        return {
            message: 'Interview declined',
            promoted: promotion?.status === 'INTERVIEW_SCHEDULED',
        };
    }

    async getMessages(userId: string) {
        const [messages, unreadCount] = await Promise.all([
            prisma.message.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 100,
                select: {
                    id: true,
                    applicationId: true,
                    kind: true,
                    title: true,
                    body: true,
                    readAt: true,
                    createdAt: true,
                },
            }),
            prisma.message.count({
                where: { userId, readAt: null },
            }),
        ]);

        return { messages, unreadCount };
    }

    async markMessageRead(userId: string, messageId: string) {
        const result = await prisma.message.updateMany({
            where: { id: messageId, userId },
            data: { readAt: new Date() },
        });

        if (result.count === 0) {
            throw new AppError(404, 'Message not found');
        }

        return { message: 'Message marked as read' };
    }

    async markAllMessagesRead(userId: string) {
        const result = await prisma.message.updateMany({
            where: { userId, readAt: null },
            data: { readAt: new Date() },
        });

        return { updated: result.count };
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
