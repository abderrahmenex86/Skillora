import { useEffect } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';

import LandingView from './views/guest/LandingView';
import HowItWorksView from './views/guest/HowItWorksView';
import PricingView from './views/guest/PricingView';
import CompaniesView from './views/guest/CompaniesView';
import AboutView from './views/guest/AboutView';
import JobsExplorerView from './views/guest/JobsExplorerView';
import AuthView from './views/auth/AuthView';

import ApplicantDashboardView from './views/applicant/ApplicantDashboardView';
import ProfilesView from './views/applicant/ProfilesView';
import InsightsView from './views/applicant/InsightsView';

import RecruiterPositionsView from './views/recruiter/RecruiterPositionsView';
import PositionApplicationsView from './views/recruiter/PositionApplicationsView';

import { useThemeStore } from './store/useThemeStore';
import { useAuthStore, type User } from './store/useAuthStore';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
        },
    },
});

const roleHome: Record<User['role'], string> = {
    APPLICANT: '/applicant/dashboard',
    RECRUITER: '/recruiter/positions',
    ADMIN: '/',
};

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
    const user = useAuthStore((state) => state.user);
    if (user) {
        return (
            <Navigate
                to={roleHome[user.role]}
                replace
            />
        );
    }
    return <>{children}</>;
}

function ProtectedRoute({
    children,
    allowedRole,
}: {
    children: React.ReactNode;
    allowedRole: 'APPLICANT' | 'RECRUITER';
}) {
    const user = useAuthStore((state) => state.user);
    if (!user) {
        return (
            <Navigate
                to='/auth?mode=login'
                replace
            />
        );
    }
    if (user.role !== allowedRole) {
        return (
            <Navigate
                to='/'
                replace
            />
        );
    }
    return <>{children}</>;
}

export default function App() {
    const initTheme = useThemeStore((state) => state.initTheme);

    useEffect(() => {
        initTheme();
    }, [initTheme]);

    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <div className='min-h-screen flex flex-col bg-(--bg-canvas) text-(--text-main)'>
                    <Navbar />
                    <div className='flex-1 flex flex-col'>
                        <Routes>
                            <Route
                                path='/'
                                element={<LandingView />}
                            />
                            <Route
                                path='/how-it-works'
                                element={<HowItWorksView />}
                            />
                            <Route
                                path='/pricing'
                                element={<PricingView />}
                            />
                            <Route
                                path='/companies'
                                element={<CompaniesView />}
                            />
                            <Route
                                path='/jobs'
                                element={<JobsExplorerView />}
                            />
                            <Route
                                path='/about'
                                element={<AboutView />}
                            />
                            <Route
                                path='/auth'
                                element={
                                    <PublicOnlyRoute>
                                        <AuthView />
                                    </PublicOnlyRoute>
                                }
                            />

                            <Route
                                path='/applicant/dashboard'
                                element={
                                    <ProtectedRoute allowedRole='APPLICANT'>
                                        <ApplicantDashboardView />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/applicant/applications'
                                element={
                                    <Navigate
                                        to='/applicant/dashboard'
                                        replace
                                    />
                                }
                            />
                            <Route
                                path='/applicant/profiles'
                                element={
                                    <ProtectedRoute allowedRole='APPLICANT'>
                                        <ProfilesView />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/applicant/insights'
                                element={
                                    <ProtectedRoute allowedRole='APPLICANT'>
                                        <InsightsView />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path='/recruiter/positions'
                                element={
                                    <ProtectedRoute allowedRole='RECRUITER'>
                                        <RecruiterPositionsView />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/recruiter/positions/:id/applications'
                                element={
                                    <ProtectedRoute allowedRole='RECRUITER'>
                                        <PositionApplicationsView />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path='*'
                                element={
                                    <Navigate
                                        to='/'
                                        replace
                                    />
                                }
                            />
                        </Routes>
                    </div>
                </div>
            </Router>
        </QueryClientProvider>
    );
}
