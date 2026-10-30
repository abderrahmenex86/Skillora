import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: string;
    email: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    phone?: string | null;
    wilaya?: string | null;
    companyName?: string | null;
    companyId?: string | null;
    companyStatus?:
        | 'DRAFT'
        | 'PENDING'
        | 'APPROVED'
        | 'REJECTED'
        | 'FROZEN'
        | 'ARCHIVED'
        | 'DELETED'
        | null;
    role: 'APPLICANT' | 'RECRUITER' | 'ADMIN';
    subscriptionTier: 'FREE' | 'PRO' | 'ENTERPRISE';
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    setTokens: (accessToken: string, user: User) => void;
    setUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            setTokens: (accessToken, user) => set({ accessToken, user }),
            setUser: (user) => set({ user }),
            logout: () => set({ user: null, accessToken: null }),
        }),
        {
            name: 'skillora-auth',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
            }),
        }
    )
);
