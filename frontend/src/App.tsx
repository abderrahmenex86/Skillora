import { useEffect } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    Outlet,
    useLocation,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from './api/apiClient';
import { queryClient } from './api/queryClient';
import Navbar from './components/Navbar';

import LandingView from './views/guest/LandingView';
import HowItWorksView from './views/guest/HowItWorksView';
import PricingView from './views/guest/PricingView';
import CompaniesView from './views/guest/CompaniesView';
import AboutView from './views/guest/AboutView';
import TermsView from './views/guest/TermsView';
import PrivacyView from './views/guest/PrivacyView';
import JobsExplorerView from './views/guest/JobsExplorerView';
import NotFoundView from './views/NotFoundView';
import AuthView from './views/auth/AuthView';
import PasswordResetView from './views/auth/PasswordResetView';
import EditProfileView from './views/settings/EditProfileView';

import ApplicantDashboardView from './views/applicant/ApplicantDashboardView';
import ProfilesView from './views/applicant/ProfilesView';
import InsightsView from './views/applicant/InsightsView';

import RecruiterPositionsView from './views/recruiter/RecruiterPositionsView';
import PositionApplicationsView from './views/recruiter/PositionApplicationsView';

import { roleHome } from './data/routes';
import { redirectFromLocationState } from './lib/redirect';
import { useThemeStore } from './store/useThemeStore';
import { useAuthStore } from './store/useAuthStore';

function PageTransition({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    return (
        <div
            key={location.pathname}
            className='flex min-h-0 flex-1 flex-col page-transition'>
            {children}
        </div>
    );
}

function AppLayout() {
    return (
        <div className='flex h-dvh flex-col overflow-hidden bg-(--bg-canvas) text-(--text-main)'>
            <Navbar />
            <PageTransition>
                <Outlet />
            </PageTransition>
        </div>
    );
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
    const user = useAuthStore((state) => state.user);
    const location = useLocation();
    const hasRedirect =
        Boolean(new URLSearchParams(location.search).get('redirect')) ||
        Boolean(redirectFromLocationState(location.state));

    if (user && !hasRedirect) {
        return (
            <Navigate
                to={roleHome[user.role]}
                replace
            />
        );
    }
    return <>{children}</>;
}

function SignedInRoute({ children }: { children: React.ReactNode }) {
    const user = useAuthStore((state) => state.user);
    const location = useLocation();

    if (!user) {
        return (
            <Navigate
                to='/auth?mode=login'
                state={{ from: location }}
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
    const location = useLocation();

    if (!user) {
        return (
            <Navigate
                to='/auth?mode=login'
                state={{ from: location }}
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
    const accessToken = useAuthStore((state) => state.accessToken);
    const setUser = useAuthStore((state) => state.setUser);

    useEffect(() => {
        initTheme();
    }, [initTheme]);

    useEffect(() => {
        if (!accessToken) return;

        let cancelled = false;
        apiClient
            .get('/auth/me')
            .then(({ data }) => {
                if (!cancelled) setUser(data.user);
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [accessToken, setUser]);

    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <Routes>
                    <Route element={<AppLayout />}>
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
                            path='/jobs/:jobId'
                            element={<JobsExplorerView />}
                        />
                        <Route
                            path='/about'
                            element={<AboutView />}
                        />
                        <Route
                            path='/terms'
                            element={<TermsView />}
                        />
                        <Route
                            path='/privacy'
                            element={<PrivacyView />}
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
                            path='/auth/reset-password'
                            element={
                                <PublicOnlyRoute>
                                    <PasswordResetView />
                                </PublicOnlyRoute>
                            }
                        />

                        <Route
                            path='/settings/profile'
                            element={
                                <SignedInRoute>
                                    <EditProfileView />
                                </SignedInRoute>
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
                    </Route>

                    <Route
                        path='*'
                        element={<NotFoundView />}
                    />
                </Routes>
            </Router>
        </QueryClientProvider>
    );
}
