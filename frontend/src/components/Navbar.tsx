import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { Sun, Moon, LogOut } from 'lucide-react';

export default function Navbar() {
    const { isDark, toggleTheme } = useThemeStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className='sticky top-0 z-50 w-full border-b border-(--border-line) bg-(--bg-canvas)/95 backdrop-blur-sm transition-colors'>
            <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
                <div className='flex items-center'>
                    <Link
                        to='/'
                        className='font-grotesque font-bold text-3xl tracking-tight text-forest dark:text-forest-dark transition-colors'>
                        Skillora
                    </Link>
                </div>

                <nav className='hidden md:flex items-center space-x-8 text-sm font-medium'>
                    {!user && (
                        <>
                            <Link
                                to='/how-it-works'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                How It Works
                            </Link>
                            <Link
                                to='/pricing'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                Pricing
                            </Link>
                            <Link
                                to='/companies'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                Companies
                            </Link>
                            <Link
                                to='/jobs'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                Jobs
                            </Link>
                            <Link
                                to='/about'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                About Us
                            </Link>
                        </>
                    )}

                    {user?.role === 'APPLICANT' && (
                        <>
                            <Link
                                to='/applicant/dashboard'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                Dashboard & Calendar
                            </Link>
                            <Link
                                to='/applicant/profiles'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                Profiles
                            </Link>
                            <Link
                                to='/jobs'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                Open Positions
                            </Link>
                            <Link
                                to='/applicant/insights'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                Insights
                            </Link>
                        </>
                    )}

                    {user?.role === 'RECRUITER' && (
                        <>
                            <Link
                                to='/recruiter/positions'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                Positions History
                            </Link>
                            <Link
                                to='/jobs'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                Public Jobs Preview
                            </Link>
                            <Link
                                to='/pricing'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                Plans
                            </Link>
                        </>
                    )}
                </nav>

                <div className='flex items-center space-x-3'>
                    <button
                        type='button'
                        onClick={toggleTheme}
                        aria-label='Toggle dark mode'
                        className='p-2 rounded-md border border-(--border-line) text-(--text-sub) hover:text-(--text-main) hover:bg-(--bg-panel) transition-all flex items-center justify-center'>
                        {isDark ?
                            <Sun
                                size={17}
                                className='text-amber-400'
                            />
                        :   <Moon size={17} />}
                    </button>

                    {!user ?
                        <>
                            <Link
                                to='/auth?mode=login'
                                className='px-4 py-2 text-sm font-medium rounded-md border border-(--border-line) text-(--text-main) hover:bg-(--bg-panel) transition-colors'>
                                Login
                            </Link>
                            <Link
                                to='/auth?mode=register'
                                className='px-4 py-2 text-sm font-medium rounded-md bg-(--btn-main-bg) text-(--btn-main-text) hover:opacity-90 transition-opacity'>
                                Register
                            </Link>
                        </>
                    :   <div className='flex items-center space-x-3'>
                            <span className='font-mono text-xs text-(--text-sub) hidden sm:inline'>
                                [{user.role}]
                            </span>
                            <button
                                onClick={handleLogout}
                                title='Log out'
                                className='p-2 rounded-md border border-(--border-line) text-(--text-sub) hover:text-(--text-main) hover:bg-(--bg-panel) transition-colors'>
                                <LogOut size={16} />
                            </button>
                        </div>
                    }
                </div>
            </div>
        </header>
    );
}
