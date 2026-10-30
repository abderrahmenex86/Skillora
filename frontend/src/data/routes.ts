import type { User } from '../store/useAuthStore';

export function homeForUser(user: User | null | undefined): string {
    if (!user) return '/';

    if (user.role === 'ADMIN') return '/admin/companies';
    if (user.role === 'APPLICANT') return '/applicant/dashboard';

    switch (user.companyStatus) {
        case 'DRAFT':
        case 'REJECTED':
        case 'PENDING':
            return '/recruiter/onboarding';
        default:
            return '/recruiter/positions';
    }
}

export const roleHome: Record<User['role'], string> = {
    APPLICANT: '/applicant/dashboard',
    RECRUITER: '/recruiter/positions',
    ADMIN: '/admin/companies',
};
