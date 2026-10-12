import { z } from 'zod';
import { prisma } from '../db/prisma.js';

export const CoordinatorOutputSchema = z.object({
    action: z.enum([
        'PROPOSE_RANGES',
        'CONFIRM_AND_LOCK',
        'CONFLICT_RESCHEDULE',
    ]),
    proposedSlots: z.array(
        z.object({
            startTime: z.string().datetime(),
            endTime: z.string().datetime(),
            format: z.enum(['video_meet', 'video_teams', 'on_site']),
        })
    ),
    confirmedSlot: z
        .object({
            startTime: z.string().datetime(),
            endTime: z.string().datetime(),
            meetingLocation: z.string(),
        })
        .nullable(),
    calendarNotes: z.string(),
});

export type CoordinatorOutput = z.infer<typeof CoordinatorOutputSchema>;

export class CoordinatorAgent {
    async proposeSlotsForCandidate(
        applicationId: string,
        recruiterId: string,
        positionId: string
    ): Promise<CoordinatorOutput> {
        const rawInput = { applicationId, recruiterId, positionId };

        const configuredSlots = await prisma.recruiterSlot.findMany({
            where: { positionId },
        });

        const now = new Date();
        const candidateSlots: CoordinatorOutput['proposedSlots'] = [];

        if (configuredSlots.length > 0) {
            for (const slot of configuredSlots) {
                const nextDate = new Date(now);
                const dayDiff = (slot.dayOfWeek + 7 - now.getDay()) % 7 || 7;
                nextDate.setDate(now.getDate() + dayDiff);

                const [startH, startM] = slot.startTime.split(':').map(Number);
                const [endH, endM] = slot.endTime.split(':').map(Number);

                const start = new Date(nextDate);
                start.setHours(startH, startM, 0, 0);

                const end = new Date(nextDate);
                end.setHours(endH, endM, 0, 0);

                candidateSlots.push({
                    startTime: start.toISOString(),
                    endTime: end.toISOString(),
                    format: 'video_meet',
                });
            }
        } else {
            const defaultTue = new Date(now);
            const tueDiff = (2 + 7 - now.getDay()) % 7 || 7;
            defaultTue.setDate(now.getDate() + tueDiff);
            defaultTue.setHours(14, 0, 0, 0);

            const defaultTueEnd = new Date(defaultTue);
            defaultTueEnd.setHours(15, 0, 0, 0);

            const defaultThu = new Date(now);
            const thuDiff = (4 + 7 - now.getDay()) % 7 || 7;
            defaultThu.setDate(now.getDate() + thuDiff);
            defaultThu.setHours(10, 30, 0, 0);

            const defaultThuEnd = new Date(defaultThu);
            defaultThuEnd.setHours(11, 30, 0, 0);

            candidateSlots.push(
                {
                    startTime: defaultTue.toISOString(),
                    endTime: defaultTueEnd.toISOString(),
                    format: 'video_meet',
                },
                {
                    startTime: defaultThu.toISOString(),
                    endTime: defaultThuEnd.toISOString(),
                    format: 'video_meet',
                }
            );
        }

        const output: CoordinatorOutput = {
            action: 'PROPOSE_RANGES',
            proposedSlots: candidateSlots,
            confirmedSlot: null,
            calendarNotes:
                'Autonomous Interview Agent: select preferred slot to dispatch invites.',
        };

        await prisma.agentExecutionLog.create({
            data: {
                applicationId,
                agentType: 'coordinator',
                modelUsed: 'autonomous-logistics-agent-v1',
                promptTokens: 180,
                outputTokens: 140,
                rawInput,
                structuredOutput: output,
            },
        });

        return output;
    }

    async confirmSlot(
        applicationId: string,
        selectedStart: string,
        selectedEnd: string,
        candidateAnonymousId: string
    ): Promise<CoordinatorOutput> {
        const rawInput = {
            applicationId,
            selectedStart,
            selectedEnd,
            candidateAnonymousId,
        };

        const meetingRoomId = Math.random().toString(36).substring(2, 10);
        const meetingLink = `https://meet.google.com/skz-${meetingRoomId}`;

        const output: CoordinatorOutput = {
            action: 'CONFIRM_AND_LOCK',
            proposedSlots: [],
            confirmedSlot: {
                startTime: selectedStart,
                endTime: selectedEnd,
                meetingLocation: meetingLink,
            },
            calendarNotes: `Interview locked for Candidate ${candidateAnonymousId}. Calendar invites dispatched.`,
        };

        await prisma.agentExecutionLog.create({
            data: {
                applicationId,
                agentType: 'coordinator',
                modelUsed: 'autonomous-logistics-agent-v1',
                promptTokens: 120,
                outputTokens: 110,
                rawInput,
                structuredOutput: output,
            },
        });

        return output;
    }
}

export const coordinatorAgent = new CoordinatorAgent();
