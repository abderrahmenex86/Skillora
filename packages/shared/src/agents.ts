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
                'degree',
                'experience',
            ]),
            title: z.string(),
            summary: z.string(),
            metrics: z.array(
                z.object({
                    label: z.string(),
                    value: z.string(),
                })
            ),
        })
    ),
});

export type IngestionOutput = z.infer<typeof IngestionOutputSchema>;

export const MatcherOutputSchema = z.object({
    matchScore: z.number().min(0).max(100),
    rubricScore: z.number().min(0).max(100),
    category: z.enum(['ELIGIBLE', 'NEEDS_REVIEW', 'REDIRECTED']),
    mandatoryCriteriaAudit: z.array(
        z.object({
            criterion: z.string(),
            satisfied: z.boolean(),
            evidenceFound: z.string().nullable(),
        })
    ),
    descriptionAudit: z.object({
        score: z.number().min(0).max(100),
        strengths: z.array(z.string()),
        gaps: z.array(z.string()),
        rationale: z.string(),
    }),
    experienceAudit: z.object({
        targetYears: z.number().nullable(),
        provenYears: z.number().nullable(),
        score: z.number().min(0).max(100),
        rationale: z.string(),
    }),
    strengths: z.array(z.string()),
    unmetRequirements: z.array(z.string()),
});

export type MatcherOutput = z.infer<typeof MatcherOutputSchema>;

export const GrowthOutputSchema = z.object({
    letter: z.string(),
    verifiedStrengths: z.array(z.string()),
    unmetMandatoryReasons: z.array(z.string()),
    descriptionGaps: z.array(z.string()),
    experienceNote: z.string(),
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
