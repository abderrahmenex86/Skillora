import { z } from 'zod';

const optionalText = (max: number) =>
    z.union([z.string().trim().max(max), z.literal('')]).optional();

export const UpdateCompanySchema = z.object({
    name: z.string().trim().min(2).max(150).optional(),
    employeeCount: z.number().int().min(1).max(1_000_000).optional(),
    industry: optionalText(100),
    website: z
        .union([z.string().trim().url('Enter a valid URL'), z.literal('')])
        .optional(),
    description: optionalText(2000),
});

export const AddDepartmentSchema = z.object({
    name: z.string().trim().min(1).max(100),
});

export const UpdateDepartmentSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
});

export const AddBranchSchema = z.object({
    label: z.string().trim().min(1).max(100),
    wilaya: z.string().trim().min(2).max(100),
    address: optionalText(200),
    isHeadquarters: z.boolean().optional(),
});

export const UpdateBranchSchema = z.object({
    label: z.string().trim().min(1).max(100).optional(),
    wilaya: z.string().trim().min(2).max(100).optional(),
    address: optionalText(200),
    isHeadquarters: z.boolean().optional(),
    isActive: z.boolean().optional(),
});

export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
export type AddDepartmentInput = z.infer<typeof AddDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;
export type AddBranchInput = z.infer<typeof AddBranchSchema>;
export type UpdateBranchInput = z.infer<typeof UpdateBranchSchema>;
