import { z } from 'zod';

export const RegisterInputSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['APPLICANT', 'RECRUITER']).default('APPLICANT'),
});

export const LoginInputSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        role: 'APPLICANT' | 'RECRUITER' | 'ADMIN';
        subscriptionTier: 'FREE' | 'PRO' | 'ENTERPRISE';
    };
    accessToken: string;
}

export const CreateProfileInputSchema = z.object({
    title: z.string().min(3).max(100),
    resumeUrl: z.string().url(),
    summary: z.string().optional(),
    skills: z.array(z.string()),
    metadata: z.record(z.string(), z.any()).optional(),
});

export const SubmitApplicationInputSchema = z.object({
    positionId: z.string().uuid(),
    profileId: z.string().uuid(),
});

export const OverrideDecisionInputSchema = z.object({
    applicationId: z.string().uuid(),
    newStatus: z.enum(['ELIGIBLE', 'REDIRECTED', 'NEEDS_REVIEW']),
    notes: z.string().min(5),
});

export const SelectDateRangeInputSchema = z.object({
    interviewEventId: z.string().uuid(),
    selectedRange: z.object({
        preferredStart: z.string().datetime(),
        preferredEnd: z.string().datetime(),
    }),
});
