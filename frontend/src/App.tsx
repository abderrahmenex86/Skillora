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
import JobsExplorerView from './views/guest/JobsExplorerView';
import NotFoundView from './views/NotFoundView';
import AuthView from './views/auth/AuthView';
import PersonalInfoView from './views/settings/PersonalInfoView';

import ApplicantDashboardView from './views/applicant/ApplicantDashboardView';
import ProfilesView from './views/applicant/ProfilesView';
import InsightsView from './views/applicant/InsightsView';

import RecruiterPositionsView from './views/recruiter/RecruiterPositionsView';
import PositionApplicationsView from './views/recruiter/PositionApplicationsView';

import { roleHome } from './data/routes';
import { useThemeStore } from './store/useThemeStore';
import { useAuthStore } from './store/useAuthStore';

function PageTransition({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    return (
        <div
            key={location.pathname}
            className='flex-1 flex flex-col page-transition'>
            {children}
        </div>
    );
}

function AppLayout() {
    return (
        <div className='min-h-dvh flex flex-col bg-(--bg-canvas) text-(--text-main)'>
            <Navbar />
            <PageTransition>
                <Outlet />
            </PageTransition>
        </div>
    );
}

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

function SignedInRoute({ children }: { children: React.ReactNode }) {
    const user = useAuthStore((state) => state.user);
    if (!user) {
        return (
            <Navigate
                to='/auth?mode=login'
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
                            element={
                                <SignedInRoute>
                                    <JobsExplorerView />
                                </SignedInRoute>
                            }
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
                            path='/settings/profile'
                            element={
                                <SignedInRoute>
                                    <PersonalInfoView />
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
