import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

export const CreatePositionSchema = z
    .object({
        companyName: z.string().min(2).max(150),
        title: z.string().min(2).max(150),
        department: z.string().min(2).max(100),
        location: z.string().min(2).max(100),
        deadline: z.string().datetime('Deadline must be an ISO 8601 date string'),
        interviewCapacity: z
            .number()
            .int()
            .min(1, 'At least 1 interview slot is required')
            .max(500, 'Interview capacity cannot exceed 500'),
        interviewRangeStart: z
            .string()
            .datetime('Interview range start must be an ISO 8601 date string'),
        interviewRangeEnd: z
            .string()
            .datetime('Interview range end must be an ISO 8601 date string'),
        rubric: z.object({
            mandatoryCriteria: z
                .array(z.string().min(1))
                .min(1, 'At least 1 mandatory criterion required'),
            preferredCriteria: z.array(z.string()).default([]),
            minimumScoreThreshold: z.number().min(0).max(100).default(70),
        }),
    })
    .refine(
        (data) =>
            new Date(data.deadline) <= new Date(data.interviewRangeStart),
        {
            message:
                'Interview range must start on or after the application deadline',
            path: ['interviewRangeStart'],
        }
    )
    .refine(
        (data) =>
            new Date(data.interviewRangeStart) <
            new Date(data.interviewRangeEnd),
        {
            message: 'Interview range must end after it starts',
            path: ['interviewRangeEnd'],
        }
    );

export const OverrideDecisionSchema = z.object({
    newStatus: z.enum([
        ApplicationStatus.ELIGIBLE,
        ApplicationStatus.REDIRECTED,
        ApplicationStatus.NEEDS_REVIEW,
    ]),
    notes: z.string().min(3, 'Override reason notes are required'),
});

export const ConfigureSlotSchema = z.object({
    positionId: z.string().uuid('Invalid position ID'),
    dayOfWeek: z.number().min(0).max(6), // 0 = Sunday, 1 = Monday, etc.
    startTime: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:mm required'),
    endTime: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:mm required'),
});

export const UpgradeCompanyPlanSchema = z.object({
    months: z.union([z.literal(1), z.literal(12)], {
        errorMap: () => ({
            message: 'Company plans are available monthly or annually',
        }),
    }),
});

export type ConfigureSlotInput = z.infer<typeof ConfigureSlotSchema>;
export type CreatePositionInput = z.infer<typeof CreatePositionSchema>;
export type OverrideDecisionInput = z.infer<typeof OverrideDecisionSchema>;
export type UpgradeCompanyPlanInput = z.infer<
    typeof UpgradeCompanyPlanSchema
>;
