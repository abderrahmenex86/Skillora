import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: string;
    email: string;
    role: 'APPLICANT' | 'RECRUITER' | 'ADMIN';
    subscriptionTier: 'FREE' | 'PRO' | 'ENTERPRISE';
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    setTokens: (accessToken: string, user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            setTokens: (accessToken, user) => set({ accessToken, user }),
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
