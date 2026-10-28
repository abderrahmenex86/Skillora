import { randomUUID } from 'node:crypto';
import { generateObject } from 'ai';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { logAgentExecution } from './agent-log.js';
import {
    describeError,
    getLlmModelUsed,
    getLlmRuntime,
} from './model.factory.js';

const INTERVIEW_TIMEZONE = 'Africa/Algiers';
const HORIZON_DAYS = 14;
const MAX_PROPOSED_SLOTS = 4;

export const GoogleMeetPayloadSchema = z.object({
    provider: z.literal('google_meet'),
    requestId: z.string(),
    summary: z.string(),
    description: z.string(),
    timezone: z.string(),
    startTime: z.string().datetime().nullable(),
    endTime: z.string().datetime().nullable(),
    attendees: z.array(z.string()),
    conferenceData: z.object({
        createRequest: z.object({
            requestId: z.string(),
            conferenceSolutionKey: z.object({
                type: z.literal('hangoutsMeet'),
            }),
        }),
    }),
});

export type GoogleMeetPayload = z.infer<typeof GoogleMeetPayloadSchema>;

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
    meetingPayload: GoogleMeetPayloadSchema.nullable(),
    calendarNotes: z.string(),
});

export type CoordinatorOutput = z.infer<typeof CoordinatorOutputSchema>;

interface AvailabilityWindow {
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    localTime: string;
}

interface SlotDefinition {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

const DEFAULT_SLOTS: SlotDefinition[] = [
    { dayOfWeek: 2, startTime: '14:00', endTime: '15:00' },
    { dayOfWeek: 4, startTime: '10:30', endTime: '11:30' },
];

const PROPOSE_SYSTEM_PROMPT = `You are the Skillora Coordinator Agent. You propose interview slots from a recruiter's real availability and prepare the logistics hand-off.

Rules:
1. Choose between 2 and 4 non-overlapping slots from the supplied availability windows.
2. Use only the exact ISO startTime values from the list. Never invent, shift, or round times.
3. Each slot must end no later than the availability window's endTime.
4. Prefer earlier dates and spread the options across different days when possible.
5. action must be "PROPOSE_RANGES".
6. confirmedSlot and meetingPayload must both be null at this stage.
7. calendarNotes must be one short, candidate-facing sentence explaining that they should confirm a preferred slot to receive a Google Meet invite.
8. The response must match the provided schema exactly.`;

const CONFIRM_SYSTEM_PROMPT = `You are the Skillora Coordinator Agent finalizing a confirmed interview and preparing a Google Meet integration payload.

Rules:
1. action must be "CONFIRM_AND_LOCK".
2. proposedSlots must be an empty array.
3. confirmedSlot must use the exact startTime, endTime, and meetingLocation supplied by the caller.
4. meetingPayload.provider must be "google_meet"; timezone must be "Africa/Algiers".
5. meetingPayload.startTime and endTime must exactly match the confirmed slot.
6. meetingPayload.requestId and meetingPayload.conferenceData.createRequest.requestId must exactly match the supplied request ID.
7. conferenceSolutionKey.type must be "hangoutsMeet".
8. attendees must be an empty array. Never invent attendee emails.
9. calendarNotes must confirm the booking and state that calendar invites are queued.
10. summary and description must be concise, professional, and include the anonymous candidate reference only.
11. The response must match the provided schema exactly.`;

function buildAvailability(
    configuredSlots: SlotDefinition[],
    now: Date
): AvailabilityWindow[] {
    const source =
        configuredSlots.length > 0 ? configuredSlots : DEFAULT_SLOTS;
    const windows: AvailabilityWindow[] = [];

    for (let offset = 0; offset < HORIZON_DAYS; offset += 1) {
        const date = new Date(now);
        date.setDate(now.getDate() + offset);

        for (const slot of source) {
            if (date.getDay() !== slot.dayOfWeek) continue;

            const [startHour, startMinute] = slot.startTime
                .split(':')
                .map(Number);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);

            const start = new Date(date);
            start.setHours(startHour, startMinute, 0, 0);

            const end = new Date(date);
            end.setHours(endHour, endMinute, 0, 0);

            if (start <= now || end <= start) continue;

            windows.push({
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                dayOfWeek: slot.dayOfWeek,
                localTime: `${slot.startTime}–${slot.endTime}`,
            });
        }
    }

    const seen = new Set<string>();
    return windows
        .filter((window) => {
            if (seen.has(window.startTime)) return false;
            seen.add(window.startTime);
            return true;
        })
        .sort(
            (a, b) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime()
        )
        .slice(0, MAX_PROPOSED_SLOTS * 3);
}

function buildProposalPrompt(
    anonymousId: string,
    positionTitle: string,
    now: Date,
    availability: AvailabilityWindow[]
) {
    return `Current time: ${now.toISOString()}
Timezone: ${INTERVIEW_TIMEZONE}
Anonymous candidate reference: ${anonymousId}
Position: ${positionTitle}

Recruiter availability windows (choose only from these exact ISO ranges):
<availability>
${JSON.stringify(availability, null, 2)}
</availability>

Return the proposed interview slots and the candidate-facing logistics note.`;
}

function buildConfirmPrompt(
    candidateAnonymousId: string,
    selectedStart: string,
    selectedEnd: string,
    meetingLink: string,
    requestId: string
) {
    return `Confirmed interview window:
- startTime: ${selectedStart}
- endTime: ${selectedEnd}
- timezone: ${INTERVIEW_TIMEZONE}
- anonymous candidate reference: ${candidateAnonymousId}
- meeting location: ${meetingLink}
- Google Meet request ID: ${requestId}

Build the confirmed coordinator output and the Google Meet integration payload.`;
}

function buildFallbackProposal(
    availability: AvailabilityWindow[]
): CoordinatorOutput {
    const chosen = availability.slice(0, 2);

    return {
        action: 'PROPOSE_RANGES',
        proposedSlots: chosen.map((window) => ({
            startTime: window.startTime,
            endTime: window.endTime,
            format: 'video_meet',
        })),
        confirmedSlot: null,
        meetingPayload: null,
        calendarNotes:
            'Select your preferred slot to receive a Google Meet invitation.',
    };
}

function buildMeetingPayload(
    candidateAnonymousId: string,
    selectedStart: string,
    selectedEnd: string,
    meetingLink: string,
    requestId: string
): GoogleMeetPayload {
    return {
        provider: 'google_meet',
        requestId,
        summary: `Skillora interview — ${candidateAnonymousId}`,
        description: `Interview scheduled through Skillora. Candidate reference: ${candidateAnonymousId}. Meeting: ${meetingLink}`,
        timezone: INTERVIEW_TIMEZONE,
        startTime: selectedStart,
        endTime: selectedEnd,
        attendees: [],
        conferenceData: {
            createRequest: {
                requestId,
                conferenceSolutionKey: {
                    type: 'hangoutsMeet',
                },
            },
        },
    };
}

function buildFallbackConfirmation(
    candidateAnonymousId: string,
    selectedStart: string,
    selectedEnd: string,
    meetingLink: string,
    requestId: string
): CoordinatorOutput {
    return {
        action: 'CONFIRM_AND_LOCK',
        proposedSlots: [],
        confirmedSlot: {
            startTime: selectedStart,
            endTime: selectedEnd,
            meetingLocation: meetingLink,
        },
        meetingPayload: buildMeetingPayload(
            candidateAnonymousId,
            selectedStart,
            selectedEnd,
            meetingLink,
            requestId
        ),
        calendarNotes: `Interview locked for candidate ${candidateAnonymousId}. Calendar invites are queued.`,
    };
}

function sanitizeProposedSlots(
    proposed: CoordinatorOutput['proposedSlots'],
    availability: AvailabilityWindow[]
): CoordinatorOutput['proposedSlots'] {
    const byStart = new Map(
        availability.map((window) => [window.startTime, window])
    );

    const sanitized = proposed
        .map((slot) => {
            const window = byStart.get(slot.startTime);
            if (!window) return null;

            const proposedEnd = new Date(slot.endTime);
            const windowEnd = new Date(window.endTime);
            const end = proposedEnd <= windowEnd ? proposedEnd : windowEnd;

            return {
                startTime: window.startTime,
                endTime: end.toISOString(),
                format: 'video_meet' as const,
            };
        })
        .filter(
            (slot): slot is NonNullable<typeof slot> => slot !== null
        );

    const seen = new Set<string>();
    return sanitized
        .filter((slot) => {
            if (seen.has(slot.startTime)) return false;
            seen.add(slot.startTime);
            return true;
        })
        .slice(0, MAX_PROPOSED_SLOTS);
}

export class CoordinatorAgent {
    async proposeSlotsForCandidate(
        applicationId: string,
        recruiterId: string,
        positionId: string
    ): Promise<CoordinatorOutput> {
        const [configuredSlots, application] = await Promise.all([
            prisma.recruiterSlot.findMany({
                where: { positionId },
                select: {
                    dayOfWeek: true,
                    startTime: true,
                    endTime: true,
                },
            }),
            prisma.application.findUnique({
                where: { id: applicationId },
                select: {
                    anonymousId: true,
                    position: { select: { title: true } },
                },
            }),
        ]);

        const now = new Date();
        const availability = buildAvailability(configuredSlots, now);
        const anonymousId = application?.anonymousId ?? 'anonymous';
        const positionTitle =
            application?.position.title ?? 'the advertised position';

        const rawInput = {
            applicationId,
            recruiterId,
            positionId,
            timezone: INTERVIEW_TIMEZONE,
            availability,
        };

        const runtime = getLlmRuntime();

        if (runtime && availability.length > 0) {
            try {
                const { object, usage } = await generateObject({
                    model: runtime.model,
                    schema: CoordinatorOutputSchema,
                    schemaName: 'CoordinatorProposal',
                    schemaDescription:
                        'Interview slot proposal derived from recruiter availability.',
                    system: PROPOSE_SYSTEM_PROMPT,
                    prompt: buildProposalPrompt(
                        anonymousId,
                        positionTitle,
                        now,
                        availability
                    ),
                    temperature: runtime.temperature,
                    maxRetries: runtime.maxRetries,
                    maxOutputTokens: 1800,
                });

                const proposedSlots = sanitizeProposedSlots(
                    object.proposedSlots,
                    availability
                );

                const output: CoordinatorOutput = {
                    action: 'PROPOSE_RANGES',
                    proposedSlots:
                        proposedSlots.length > 0 ?
                            proposedSlots
                        :   buildFallbackProposal(availability).proposedSlots,
                    confirmedSlot: null,
                    meetingPayload: null,
                    calendarNotes:
                        object.calendarNotes?.trim() ||
                        'Select your preferred slot to receive a Google Meet invitation.',
                };

                await logAgentExecution({
                    applicationId,
                    agentType: 'coordinator',
                    modelUsed: getLlmModelUsed(runtime),
                    usage,
                    rawInput,
                    structuredOutput: output,
                });

                return output;
            } catch (error) {
                console.warn(
                    `[agents:coordinator] LLM proposal failed (${describeError(
                        error
                    )}); using deterministic fallback.`
                );
            }
        }

        const output = buildFallbackProposal(availability);

        await logAgentExecution({
            applicationId,
            agentType: 'coordinator',
            modelUsed: 'deterministic-logistics-v2',
            rawInput,
            structuredOutput: output,
        });

        return output;
    }

    async confirmSlot(
        applicationId: string,
        selectedStart: string,
        selectedEnd: string,
        candidateAnonymousId: string
    ): Promise<CoordinatorOutput> {
        const meetingRoomId = Math.random().toString(36).substring(2, 10);
        const meetingLink = `https://meet.google.com/skz-${meetingRoomId}`;
        const requestId = randomUUID();

        const rawInput = {
            applicationId,
            selectedStart,
            selectedEnd,
            candidateAnonymousId,
            meetingLink,
            requestId,
            timezone: INTERVIEW_TIMEZONE,
        };

        const runtime = getLlmRuntime();

        if (runtime) {
            try {
                const { object, usage } = await generateObject({
                    model: runtime.model,
                    schema: CoordinatorOutputSchema,
                    schemaName: 'CoordinatorConfirmation',
                    schemaDescription:
                        'Confirmed interview details and Google Meet integration payload.',
                    system: CONFIRM_SYSTEM_PROMPT,
                    prompt: buildConfirmPrompt(
                        candidateAnonymousId,
                        selectedStart,
                        selectedEnd,
                        meetingLink,
                        requestId
                    ),
                    temperature: runtime.temperature,
                    maxRetries: runtime.maxRetries,
                    maxOutputTokens: 1800,
                });

                const fallbackPayload = buildMeetingPayload(
                    candidateAnonymousId,
                    selectedStart,
                    selectedEnd,
                    meetingLink,
                    requestId
                );

                const output: CoordinatorOutput = {
                    action: 'CONFIRM_AND_LOCK',
                    proposedSlots: [],
                    confirmedSlot: {
                        startTime: selectedStart,
                        endTime: selectedEnd,
                        meetingLocation: meetingLink,
                    },
                    meetingPayload: {
                        ...(object.meetingPayload ?? fallbackPayload),
                        provider: 'google_meet',
                        requestId,
                        timezone: INTERVIEW_TIMEZONE,
                        startTime: selectedStart,
                        endTime: selectedEnd,
                        attendees: [],
                        conferenceData: {
                            createRequest: {
                                requestId,
                                conferenceSolutionKey: {
                                    type: 'hangoutsMeet',
                                },
                            },
                        },
                    },
                    calendarNotes:
                        object.calendarNotes?.trim() ||
                        `Interview locked for candidate ${candidateAnonymousId}. Calendar invites are queued.`,
                };

                await logAgentExecution({
                    applicationId,
                    agentType: 'coordinator',
                    modelUsed: getLlmModelUsed(runtime),
                    usage,
                    rawInput,
                    structuredOutput: output,
                });

                return output;
            } catch (error) {
                console.warn(
                    `[agents:coordinator] LLM confirmation failed (${describeError(
                        error
                    )}); using deterministic fallback.`
                );
            }
        }

        const output = buildFallbackConfirmation(
            candidateAnonymousId,
            selectedStart,
            selectedEnd,
            meetingLink,
            requestId
        );

        await logAgentExecution({
            applicationId,
            agentType: 'coordinator',
            modelUsed: 'deterministic-logistics-v2',
            rawInput,
            structuredOutput: output,
        });

        return output;
    }
}

export const coordinatorAgent = new CoordinatorAgent();
