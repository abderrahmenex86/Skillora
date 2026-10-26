import type { User } from '../store/useAuthStore';

export const roleHome: Record<User['role'], string> = {
    APPLICANT: '/applicant/dashboard',
    RECRUITER: '/recruiter/positions',
    ADMIN: '/',
};
