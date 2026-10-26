import { z } from 'zod';
import { Role } from '@prisma/client';

export const RegisterSchema = z.object({
    email: z.string().email('Valid email address required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    middleName: z.string().optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phone: z.string().min(8, 'Valid phone number required').optional(),
    wilaya: z.string().min(2, 'Wilaya of residence required').optional(),
    companyName: z.string().optional(),
    role: z.nativeEnum(Role).default(Role.APPLICANT),
});

export const LoginSchema = z.object({
    email: z.string().email('Valid email address required'),
    password: z.string().min(1, 'Password is required'),
});

export const UpdateProfileSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    middleName: z.string().optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phone: z
        .string()
        .min(8, 'Valid phone number required')
        .optional()
        .or(z.literal('')),
    wilaya: z.string().min(2, 'Wilaya of residence required').optional(),
    companyName: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
