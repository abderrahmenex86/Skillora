import { z } from 'zod';

export const CreateProfileSchema = z.object({
    title: z
        .string()
        .min(2, 'Profile title must be at least 2 characters')
        .max(100),
    resumeUrl: z.string().url('Must be a valid document URL'),
    summary: z.string().max(2000).optional(),
    skills: z.array(z.string().min(1)).min(1, 'At least one skill is required'),
    metadata: z.record(z.string(), z.any()).optional(),
});

export const UpdateProfileSchema = CreateProfileSchema.partial();

export const SubmitApplicationSchema = z.object({
    positionId: z.string().uuid('Invalid position ID'),
    profileId: z.string().uuid('Invalid profile ID'),
});

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type SubmitApplicationInput = z.infer<typeof SubmitApplicationSchema>;
