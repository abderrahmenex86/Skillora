import { prisma } from '../../db/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
    CreatePositionInput,
    OverrideDecisionInput,
    ConfigureSlotInput,
    ExtendDeadlineInput,
    UpgradeCompanyPlanInput,
} from './recruiter.schema.js';
import { coordinatorAgent } from '../../agents/coordinator.agent.js';
import { notifyApplicationStatus } from '../../services/messages.js';
import {
    promoteNextOnHold,
    scheduleApplicationInterview,
} from '../../services/interview-scheduling.js';

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

function orderById<T extends { id: string }>(items: T[], ids: string[]): T[] {
    const byId = new Map(items.map((item) => [item.id, item]));
    return ids
        .map((id) => byId.get(id))
        .filter((item): item is T => Boolean(item));
}

export class RecruiterService {
    async createPosition(recruiterId: string, input: CreatePositionInput) {
        const recruiter = await prisma.user.findUnique({
            where: { id: recruiterId },
            select: {
                companyId: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    },
                },
            },
        });

        if (!recruiter?.company || !recruiter.companyId) {
            throw new AppError(403, 'Complete your company profile first');
        }

        if (recruiter.company.status !== 'APPROVED') {
            throw new AppError(
                403,
                'Your company must be approved before you can publish jobs'
            );
        }

        const department = await prisma.companyDepartment.findFirst({
            where: {
                id: input.departmentId,
                companyId: recruiter.companyId,
                isActive: true,
            },
        });
        const branch = await prisma.companyBranch.findFirst({
            where: {
                id: input.branchId,
                companyId: recruiter.companyId,
                isActive: true,
            },
        });

        if (!department || !branch) {
            throw new AppError(
                400,
                'Choose an active department and branch from your company'
            );
        }

        const deadlineDate = new Date(input.deadline);
        const interviewRangeStart = new Date(input.interviewRangeStart);
        const interviewRangeEnd = new Date(input.interviewRangeEnd);

        if (deadlineDate <= new Date()) {
            throw new AppError(400, 'Position deadline must be a future date');
        }

        if (interviewRangeStart < deadlineDate) {
            throw new AppError(
                400,
                'Interview range must start on or after the application deadline'
            );
        }

        if (interviewRangeEnd <= interviewRangeStart) {
            throw new AppError(
                400,
                'Interview range must end after it starts'
            );
        }

        return prisma.position.create({
            data: {
                recruiterId,
                companyId: recruiter.companyId,
                departmentId: department.id,
                branchId: branch.id,
                companyName: recruiter.company.name,
                title: input.title,
                department: department.name,
                location: `${branch.label} · ${branch.wilaya}`,
                description: input.description,
                minimumYearsExperience:
                    input.minimumYearsExperience ?? null,
                deadline: deadlineDate,
                interviewCapacity: input.interviewCapacity,
                interviewRangeStart,
                interviewRangeEnd,
                status: 'OPEN',
                rubric: input.rubric,
            },
        });
    }

    async getPositions(recruiterId: string) {
        const positions = await prisma.position.findMany({
            where: { recruiterId },
            include: {
                _count: {
                    select: { applications: true },
                },
            },
        });

        const now = new Date();

        return positions.sort((a, b) => {
            const aIsOpen = a.status === 'OPEN' && new Date(a.deadline) > now;
            const bIsOpen = b.status === 'OPEN' && new Date(b.deadline) > now;

            if (aIsOpen && !bIsOpen) return -1;
            if (!aIsOpen && bIsOpen) return 1;

            return (
                new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
            );
        });
    }

    async getPositionById(recruiterId: string, positionId: string) {
        const position = await prisma.position.findFirst({
            where: { id: positionId, recruiterId },
            include: {
                _count: {
                    select: { applications: true },
                },
                slots: true,
            },
        });

        if (!position) {
            throw new AppError(404, 'Position not found or access denied');
        }

        return position;
    }

    async getPositionApplications(recruiterId: string, positionId: string) {
        const position = await prisma.position.findFirst({
            where: { id: positionId, recruiterId },
        });

        if (!position) {
            throw new AppError(404, 'Position not found or access denied');
        }

        return prisma.application.findMany({
            where: { positionId },
            orderBy: { matchScore: 'desc' },
            select: {
                id: true,
                anonymousId: true,
                status: true,
                matchScore: true,
                rubricAudit: true,
                gapAnalysis: true,
                recruiterOverride: true,
                overrideNotes: true,
                appliedAt: true,
                profile: {
                    select: {
                        title: true,
                        resumeUrl: true,
                        summary: true,
                        skills: true,
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

    async getApplicationResume(recruiterId: string, applicationId: string) {
        const application = await prisma.application.findFirst({
            where: {
                id: applicationId,
                position: { recruiterId },
            },
            include: {
                profile: true,
            },
        });

        if (!application) {
            throw new AppError(404, 'Application not found or access denied');
        }

        const profile = application.profile;
        const projectIds =
            profile.selectedProjectIds.length > 0 ?
                profile.selectedProjectIds
            :   extractLegacyProjectIds(profile.selectedProjectAngles);

        const [
            educationRows,
            experienceRows,
            projectRows,
            certificationRows,
            volunteeringRows,
            languageRows,
            linkRows,
        ] = await Promise.all([
            prisma.vaultEducation.findMany({
                where: {
                    userId: profile.userId,
                    id: { in: profile.selectedEducationIds },
                },
            }),
            prisma.vaultExperience.findMany({
                where: {
                    userId: profile.userId,
                    id: { in: profile.selectedExperienceIds },
                },
            }),
            prisma.vaultProject.findMany({
                where: {
                    userId: profile.userId,
                    id: { in: projectIds },
                },
            }),
            prisma.vaultCertification.findMany({
                where: {
                    userId: profile.userId,
                    id: { in: profile.selectedCertificationIds },
                },
            }),
            prisma.vaultVolunteering.findMany({
                where: {
                    userId: profile.userId,
                    id: { in: profile.selectedVolunteeringIds },
                },
            }),
            prisma.vaultLanguage.findMany({
                where: {
                    userId: profile.userId,
                    id: { in: profile.selectedLanguageIds },
                },
            }),
            prisma.vaultLink.findMany({
                where: {
                    userId: profile.userId,
                    id: { in: profile.selectedLinkIds },
                },
            }),
        ]);

        return {
            title: profile.title,
            summary: profile.summary,
            skills: profile.skills,
            resumeUrl: profile.resumeUrl,
            education: orderById(
                educationRows,
                profile.selectedEducationIds
            ),
            experience: orderById(
                experienceRows,
                profile.selectedExperienceIds
            ),
            projects: orderById(projectRows, projectIds),
            certifications: orderById(
                certificationRows,
                profile.selectedCertificationIds
            ),
            volunteering: orderById(
                volunteeringRows,
                profile.selectedVolunteeringIds
            ),
            languages: orderById(languageRows, profile.selectedLanguageIds),
            links: orderById(linkRows, profile.selectedLinkIds),
        };
    }

    async overrideDecision(
        recruiterId: string,
        applicationId: string,
        input: OverrideDecisionInput
    ) {
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { position: true },
        });

        if (!application) {
            throw new AppError(404, 'Application not found');
        }

        if (application.position.recruiterId !== recruiterId) {
            throw new AppError(
                403,
                'You do not have access to this position pipeline'
            );
        }

        const deadlinePassed =
            new Date() >= new Date(application.position.deadline);
        const existingInterview = await prisma.interviewEvent.findUnique({
            where: { applicationId },
        });
        const hasActiveInterview =
            existingInterview !== null &&
            existingInterview.status !== 'CANCELED';
        const capacity = application.position.interviewCapacity;

        const updateDecision = async (
            status: 'INTERVIEW_SCHEDULED' | 'ON_HOLD' | 'REJECTED'
        ) => {
            const updated = await prisma.application.update({
                where: { id: applicationId },
                data: {
                    status,
                    recruiterOverride: true,
                    overrideNotes: input.notes,
                },
            });

            await notifyApplicationStatus(applicationId, updated.status);
            return updated;
        };

        if (input.action === 'PROMOTE') {
            if (deadlinePassed) {
                throw new AppError(
                    400,
                    'Standard promotion is only available before the deadline. Extend the deadline or promote with an extra interview seat.'
                );
            }

            if (!hasActiveInterview && capacity !== null) {
                const usedSeats = await prisma.interviewEvent.count({
                    where: {
                        application: {
                            positionId: application.positionId,
                        },
                        status: {
                            in: [
                                'RANGE_PENDING',
                                'SLOT_CONFIRMED',
                                'COMPLETED',
                            ],
                        },
                    },
                });

                if (usedSeats >= capacity) {
                    throw new AppError(
                        400,
                        'No free interview seat. Promote with extra seats or keep this candidate on hold.'
                    );
                }
            }

            if (!hasActiveInterview) {
                const availability =
                    await coordinatorAgent.getAvailableSlots(
                        application.positionId,
                        applicationId
                    );

                if (availability.length === 0) {
                    throw new AppError(
                        400,
                        'No interview availability inside the configured range. Add availability or extend the interview window.'
                    );
                }
            }

            const outcome =
                await scheduleApplicationInterview(applicationId);

            if (outcome.status !== 'INTERVIEW_SCHEDULED') {
                throw new AppError(
                    400,
                    'Could not schedule the interview. Add availability or keep the candidate on hold.'
                );
            }

            return updateDecision('INTERVIEW_SCHEDULED');
        }

        if (input.action === 'PROMOTE_EXTEND_CAPACITY') {
            if (hasActiveInterview || capacity === null) {
                const outcome =
                    await scheduleApplicationInterview(applicationId);

                if (outcome.status !== 'INTERVIEW_SCHEDULED') {
                    throw new AppError(
                        400,
                        'Could not schedule the interview. Add availability or keep the candidate on hold.'
                    );
                }

                return updateDecision('INTERVIEW_SCHEDULED');
            }

            const availability = await coordinatorAgent.getAvailableSlots(
                application.positionId,
                applicationId
            );

            if (availability.length === 0) {
                throw new AppError(
                    400,
                    'No interview availability inside the configured range. Add availability or extend the interview window.'
                );
            }

            await prisma.position.update({
                where: { id: application.positionId },
                data: { interviewCapacity: capacity + 1 },
            });

            try {
                const outcome =
                    await scheduleApplicationInterview(applicationId);

                if (outcome.status !== 'INTERVIEW_SCHEDULED') {
                    throw new AppError(
                        400,
                        'Could not schedule the interview after adding a seat.'
                    );
                }

                return updateDecision('INTERVIEW_SCHEDULED');
            } catch (error) {
                await prisma.position.update({
                    where: { id: application.positionId },
                    data: { interviewCapacity: capacity },
                });
                throw error;
            }
        }

        if (input.action === 'HOLD') {
            if (hasActiveInterview) {
                await prisma.interviewEvent.update({
                    where: { applicationId },
                    data: { status: 'CANCELED' },
                });
            }

            const updated = await updateDecision('ON_HOLD');

            if (hasActiveInterview) {
                await promoteNextOnHold(
                    application.positionId,
                    applicationId
                );
            }

            return updated;
        }

        if (hasActiveInterview) {
            await prisma.interviewEvent.update({
                where: { applicationId },
                data: { status: 'CANCELED' },
            });
        }

        const updated = await updateDecision('REJECTED');

        if (hasActiveInterview) {
            await promoteNextOnHold(application.positionId);
        }

        return updated;
    }

    async closePosition(recruiterId: string, positionId: string) {
        const position = await prisma.position.findFirst({
            where: { id: positionId, recruiterId },
        });

        if (!position) {
            throw new AppError(404, 'Position not found or access denied');
        }

        return prisma.position.update({
            where: { id: positionId },
            data: { status: 'CLOSED' },
        });
    }

    async extendDeadline(
        recruiterId: string,
        positionId: string,
        input: ExtendDeadlineInput
    ) {
        const position = await prisma.position.findFirst({
            where: { id: positionId, recruiterId },
        });

        if (!position) {
            throw new AppError(404, 'Position not found or access denied');
        }

        const now = new Date();
        const newDeadline = new Date(input.newDeadline);

        if (new Date(position.deadline) <= now) {
            throw new AppError(
                400,
                'The application deadline has already passed and can no longer be extended.'
            );
        }

        if (newDeadline <= new Date(position.deadline)) {
            throw new AppError(
                400,
                'The new deadline must be later than the current deadline.'
            );
        }

        return prisma.position.update({
            where: { id: positionId },
            data: { deadline: newDeadline },
        });
    }

    async configureSlot(recruiterId: string, input: ConfigureSlotInput) {
        const position = await prisma.position.findFirst({
            where: { id: input.positionId, recruiterId },
        });

        if (!position) {
            throw new AppError(404, 'Position not found or unauthorized');
        }

        return prisma.recruiterSlot.create({
            data: {
                positionId: input.positionId,
                dayOfWeek: input.dayOfWeek,
                startTime: input.startTime,
                endTime: input.endTime,
            },
        });
    }

    async upgradePlan(
        recruiterId: string,
        months: UpgradeCompanyPlanInput['months']
    ) {
        const current = await prisma.user.findUnique({
            where: { id: recruiterId },
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

        return prisma.user.update({
            where: { id: recruiterId },
            data: {
                subscriptionTier: 'ENTERPRISE',
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
    }
}

export const recruiterService = new RecruiterService();
