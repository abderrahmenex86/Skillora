import { z } from 'zod';

export const IngestionOutputSchema = z.object({
    anonymousId: z.string(),
    domain: z.enum(['tech', 'legal', 'finance', 'operations', 'other']),
    yearsOfExperience: z.number().min(0),
    educationLevel: z.string(),
    extractedSkills: z.array(z.string()),
    verifiableArtifacts: z.array(
        z.object({
            type: z.enum([
                'repo',
                'case_brief',
                'bar_license',
                'certification',
                'portfolio',
            ]),
            title: z.string(),
            summary: z.string(),
            metrics: z.record(z.string(), z.any()),
        })
    ),
});

export type IngestionOutput = z.infer<typeof IngestionOutputSchema>;

export const MatcherOutputSchema = z.object({
    matchScore: z.number().min(0).max(100),
    category: z.enum(['ELIGIBLE', 'NEEDS_REVIEW', 'REDIRECTED']),
    mandatoryCriteriaAudit: z.array(
        z.object({
            criterion: z.string(),
            satisfied: z.boolean(),
            evidenceFound: z.string().nullable(),
        })
    ),
    strengths: z.array(z.string()),
    unmetRequirements: z.array(z.string()),
});

export type MatcherOutput = z.infer<typeof MatcherOutputSchema>;

export const GrowthOutputSchema = z.object({
    badge: z.literal('ACTIONABLE GAP ANALYSIS [ZERO GHOSTING]'),
    headlineReason: z.string(),
    verifiedStrengths: z.array(z.string()),
    unmetMandatoryReasons: z.array(z.string()),
    recommendedBridgePath: z.object({
        title: z.string(),
        actionableMilestones: z.array(z.string()),
        reapplicationReadinessMilestone: z.string(),
    }),
});

export type GrowthOutput = z.infer<typeof GrowthOutputSchema>;

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
