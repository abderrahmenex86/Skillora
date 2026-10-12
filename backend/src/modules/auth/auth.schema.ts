import { z } from 'zod';
import { Role } from '@prisma/client';

export const RegisterSchema = z.object({
    email: z.string().email('Valid email address required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.nativeEnum(Role).default(Role.APPLICANT),
});

export const LoginSchema = z.object({
    email: z.string().email('Valid email address required'),
    password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
