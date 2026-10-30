import { z } from 'zod';
import { CompanyStatus } from '@prisma/client';

export const ListCompaniesQuerySchema = z.object({
    status: z.nativeEnum(CompanyStatus).optional(),
    search: z.string().trim().max(150).optional(),
});

export const RejectCompanySchema = z.object({
    reason: z.string().trim().min(3).max(1000),
});

export const DeleteCompanySchema = z.object({
    reason: z.string().trim().min(3).max(1000),
});

export type ListCompaniesQuery = z.infer<typeof ListCompaniesQuerySchema>;
export type RejectCompanyInput = z.infer<typeof RejectCompanySchema>;
export type DeleteCompanyInput = z.infer<typeof DeleteCompanySchema>;
