import { prisma } from '../../db/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
    CreatePositionInput,
    OverrideDecisionInput,
    ConfigureSlotInput,
} from './recruiter.schema.js';
import { coordinatorAgent } from '../../agents/coordinator.agent.js';
import { ApplicationStatus } from '@prisma/client';

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
}

export const recruiterService = new RecruiterService();
