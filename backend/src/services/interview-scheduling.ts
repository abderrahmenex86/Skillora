import { prisma } from '../db/prisma.js';
import { coordinatorAgent } from '../agents/coordinator.agent.js';
import { notifyApplicationStatus } from './messages.js';

export type ScheduleOutcome =
    | {
          status: 'INTERVIEW_SCHEDULED';
          eventId: string;
          startTime: string;
          endTime: string;
          meetingLink: string | null;
      }
    | { status: 'ON_HOLD' }
    | { status: 'NEEDS_REVIEW' };

const ACTIVE_INTERVIEW_STATUSES = [
    'RANGE_PENDING',
    'SLOT_CONFIRMED',
    'COMPLETED',
] as const;

/**
 * Auto-assigns the first available interview slot to an eligible application.
 * The applicant sees the interview as accepted by default and can later
 * reschedule or decline it.
 */
export async function scheduleApplicationInterview(
    applicationId: string
): Promise<ScheduleOutcome> {
    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { position: true },
    });

    if (!application) {
        throw new Error(`Application ${applicationId} not found`);
    }

    const existingEvent = await prisma.interviewEvent.findUnique({
        where: { applicationId },
    });

    if (existingEvent?.status === 'SLOT_CONFIRMED') {
        return {
            status: 'INTERVIEW_SCHEDULED',
            eventId: existingEvent.id,
            startTime: existingEvent.confirmedStart?.toISOString() ?? '',
            endTime: existingEvent.confirmedEnd?.toISOString() ?? '',
            meetingLink: existingEvent.meetingLink,
        };
    }

    const capacity = application.position.interviewCapacity;

    if (capacity !== null && !existingEvent) {
        const usedInterviews = await prisma.interviewEvent.count({
            where: {
                application: {
                    positionId: application.positionId,
                },
                status: { in: [...ACTIVE_INTERVIEW_STATUSES] },
            },
        });

        if (usedInterviews >= capacity) {
            await prisma.application.update({
                where: { id: applicationId },
                data: { status: 'ON_HOLD' },
            });
            await notifyApplicationStatus(applicationId, 'ON_HOLD');
            return { status: 'ON_HOLD' };
        }
    }

    const availability = await coordinatorAgent.getAvailableSlots(
        application.position.id,
        applicationId
    );
    const firstSlot = availability[0];
    const slot =
        firstSlot ?
            {
                startTime: firstSlot.startTime,
                endTime: firstSlot.endTime,
                format: 'video_meet' as const,
            }
        :   null;

    if (!slot) {
        await prisma.application.update({
            where: { id: applicationId },
            data: { status: 'NEEDS_REVIEW' },
        });
        await notifyApplicationStatus(applicationId, 'NEEDS_REVIEW');
        return { status: 'NEEDS_REVIEW' };
    }

    const confirmation = await coordinatorAgent.confirmSlot(
        applicationId,
        slot.startTime,
        slot.endTime,
        application.anonymousId
    );

    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    const meetingLink =
        confirmation.confirmedSlot?.meetingLocation ??
        existingEvent?.meetingLink ??
        null;

    const event = await prisma.interviewEvent.upsert({
        where: { applicationId },
        create: {
            applicationId,
            applicantId: application.applicantId,
            recruiterId: application.position.recruiterId,
            status: 'SLOT_CONFIRMED',
            proposedRanges: [slot],
            confirmedStart: start,
            confirmedEnd: end,
            meetingLink,
            meetingPayload:
                (confirmation.meetingPayload as any) ?? undefined,
            unmaskedAt: new Date(),
        },
        update: {
            status: 'SLOT_CONFIRMED',
            proposedRanges: [slot],
            confirmedStart: start,
            confirmedEnd: end,
            meetingLink,
            meetingPayload:
                (confirmation.meetingPayload as any) ?? undefined,
            unmaskedAt: new Date(),
        },
    });

    await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'INTERVIEW_SCHEDULED' },
    });
    await notifyApplicationStatus(applicationId, 'INTERVIEW_SCHEDULED');

    return {
        status: 'INTERVIEW_SCHEDULED',
        eventId: event.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        meetingLink,
    };
}

/**
 * Promotes the highest-scoring eligible candidate on hold for a position.
 * Called when a scheduled applicant declines the interview.
 */
export async function promoteNextOnHold(
    positionId: string,
    excludeApplicationId?: string
) {
    const next = await prisma.application.findFirst({
        where: {
            positionId,
            status: 'ON_HOLD',
            ...(excludeApplicationId ?
                { id: { not: excludeApplicationId } }
            :   {}),
        },
        orderBy: [{ matchScore: 'desc' }, { appliedAt: 'asc' }],
        select: { id: true },
    });

    if (!next) return null;

    return scheduleApplicationInterview(next.id);
}
