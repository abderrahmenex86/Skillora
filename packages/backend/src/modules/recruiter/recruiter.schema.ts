import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

export const CreatePositionSchema = z.object({
    companyName: z.string().min(2).max(150),
    title: z.string().min(2).max(150),
    department: z.string().min(2).max(100),
    location: z.string().min(2).max(100),
    deadline: z.string().datetime('Deadline must be an ISO 8601 date string'),
    rubric: z.object({
        mandatoryCriteria: z
            .array(z.string().min(1))
            .min(1, 'At least 1 mandatory criterion required'),
        preferredCriteria: z.array(z.string()).default([]),
        minimumScoreThreshold: z.number().min(0).max(100).default(70),
    }),
});

export const OverrideDecisionSchema = z.object({
    newStatus: z.enum([
        ApplicationStatus.ELIGIBLE,
        ApplicationStatus.REDIRECTED,
        ApplicationStatus.NEEDS_REVIEW,
    ]),
    notes: z.string().min(3, 'Override reason notes are required'),
});

export type CreatePositionInput = z.infer<typeof CreatePositionSchema>;
export type OverrideDecisionInput = z.infer<typeof OverrideDecisionSchema>;
