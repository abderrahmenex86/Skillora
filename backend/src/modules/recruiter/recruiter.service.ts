import { prisma } from '../../db/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
    CreatePositionInput,
    OverrideDecisionInput,
    ConfigureSlotInput,
    UpgradeCompanyPlanInput,
} from './recruiter.schema.js';
import { coordinatorAgent } from '../../agents/coordinator.agent.js';
import { ApplicationStatus } from '@prisma/client';

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
        const deadlineDate = new Date(input.deadline);

        if (deadlineDate <= new Date()) {
            throw new AppError(400, 'Position deadline must be a future date');
        }

        return prisma.position.create({
            data: {
                recruiterId,
                companyName: input.companyName,
                title: input.title,
                department: input.department,
                location: input.location,
                deadline: deadlineDate,
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

        if (new Date() >= new Date(application.position.deadline)) {
            throw new AppError(
                400,
                'Manual override window is closed. Decisions become permanent after the position deadline passes.'
            );
        }

        let targetStatus: ApplicationStatus = input.newStatus;

        if (input.newStatus === ApplicationStatus.ELIGIBLE) {
            const coordination =
                await coordinatorAgent.proposeSlotsForCandidate(
                    application.id,
                    application.position.recruiterId,
                    application.position.id
                );

            await prisma.interviewEvent.upsert({
                where: { applicationId: application.id },
                create: {
                    applicationId: application.id,
                    applicantId: application.applicantId,
                    recruiterId: application.position.recruiterId,
                    status: 'RANGE_PENDING',
                    proposedRanges: coordination.proposedSlots as any,
                },
                update: {
                    status: 'RANGE_PENDING',
                    proposedRanges: coordination.proposedSlots as any,
                },
            });

            targetStatus = ApplicationStatus.INTERVIEW_PENDING;
        }

        return prisma.application.update({
            where: { id: applicationId },
            data: {
                status: targetStatus,
                recruiterOverride: true,
                overrideNotes: input.notes,
            },
        });
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
