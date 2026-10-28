import { z } from 'zod';

const optionalUrl = z
    .string()
    .trim()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal(''));

const optionalText = (max: number) =>
    z.string().trim().max(max).optional();

export const CreateProfileSchema = z.object({
    title: z
        .string()
        .trim()
        .min(2, 'Resume title must be at least 2 characters')
        .max(120),
    summary: optionalText(5000),
    skills: z.array(z.string().trim().min(1)).default([]),
    resumeUrl: optionalUrl,
    selectedEducationIds: z.array(z.string().uuid()).default([]),
    selectedExperienceIds: z.array(z.string().uuid()).default([]),
    selectedProjectIds: z.array(z.string().uuid()).default([]),
    selectedCertificationIds: z.array(z.string().uuid()).default([]),
    selectedLinkIds: z.array(z.string().uuid()).default([]),
    selectedVolunteeringIds: z.array(z.string().uuid()).default([]),
    selectedLanguageIds: z.array(z.string().uuid()).default([]),
});

export const UpdateProfileSchema = CreateProfileSchema.partial();

export const AddEducationSchema = z.object({
    degree: z.string().trim().min(1, 'Degree is required').max(200),
    institution: z.string().trim().min(1, 'Institution is required').max(200),
    field: z.string().trim().min(1, 'Field of study is required').max(200),
    startDate: z.string().trim().max(50).optional(),
    endDate: z.string().trim().max(50).optional(),
});

export const AddExperienceSchema = z.object({
    company: z.string().trim().min(1, 'Company is required').max(200),
    role: z.string().trim().min(1, 'Role is required').max(200),
    location: z.string().trim().max(200).optional(),
    startDate: z.string().trim().min(1, 'Start date is required').max(50),
    endDate: z.string().trim().max(50).optional(),
    highlights: z.array(z.string().trim().min(1)).default([]),
});

export const AddProjectSchema = z.object({
    title: z.string().trim().min(1, 'Project title is required').max(200),
    projectUrl: optionalUrl,
    description: optionalText(5000),
    date: z.string().trim().max(50).optional(),
    tags: z.array(z.string().trim().min(1)).default([]),
});

export const AddCertificationSchema = z.object({
    name: z.string().trim().min(1, 'Certification name is required').max(250),
    issuer: z.string().trim().min(1, 'Issuer is required').max(250),
    issueDate: z.string().trim().max(50).optional(),
    credentialId: z.string().trim().max(200).optional(),
});

export const AddVolunteeringSchema = z.object({
    organization: z.string().trim().min(1, 'Organization is required').max(200),
    role: z.string().trim().min(1, 'Role is required').max(200),
    description: optionalText(2000),
    startDate: z.string().trim().max(50).optional(),
    endDate: z.string().trim().max(50).optional(),
});

export const AddLanguageSchema = z.object({
    name: z.string().trim().min(1, 'Language is required').max(100),
    proficiency: z.string().trim().min(1, 'Proficiency is required').max(50),
});

export const AddLinkSchema = z.object({
    label: z.string().trim().min(1, 'Link label is required').max(150),
    url: z.string().trim().url('Must be a valid URL'),
    type: z
        .enum(['portfolio', 'github', 'linkedin', 'website', 'other'])
        .default('other'),
});

export const SubmitApplicationSchema = z.object({
    positionId: z.string().uuid('Invalid position ID'),
    profileId: z.string().uuid('Invalid profile ID'),
});

export const SelectInterviewRangeSchema = z.object({
    interviewEventId: z.string().uuid('Invalid interview event ID'),
    selectedStart: z.string().datetime('Valid ISO 8601 start time required'),
    selectedEnd: z.string().datetime('Valid ISO 8601 end time required'),
});

export const UpgradePlanSchema = z.object({
    months: z.union([z.literal(1), z.literal(6), z.literal(12)], {
        errorMap: () => ({
            message: 'Candidate packs are available for 1, 6, or 12 months',
        }),
    }),
});

export type SelectInterviewRangeInput = z.infer<
    typeof SelectInterviewRangeSchema
>;
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type SubmitApplicationInput = z.infer<typeof SubmitApplicationSchema>;
export type AddEducationInput = z.infer<typeof AddEducationSchema>;
export type AddExperienceInput = z.infer<typeof AddExperienceSchema>;
export type AddProjectInput = z.infer<typeof AddProjectSchema>;
export type AddCertificationInput = z.infer<typeof AddCertificationSchema>;
export type AddVolunteeringInput = z.infer<typeof AddVolunteeringSchema>;
export type AddLanguageInput = z.infer<typeof AddLanguageSchema>;
export type AddLinkInput = z.infer<typeof AddLinkSchema>;
export type UpgradePlanInput = z.infer<typeof UpgradePlanSchema>;
