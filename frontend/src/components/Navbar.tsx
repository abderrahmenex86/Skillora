import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import {
    ChevronDown,
    LayoutDashboard,
    LogOut,
    Moon,
    Pencil,
    Sun,
    User as UserIcon,
} from 'lucide-react';
import { roleHome } from '../data/routes';
import { apiClient } from '../api/apiClient';
import { useThemeStore } from '../store/useThemeStore';
import MessagesMenu from './MessagesMenu';
import { useAuthStore } from '../store/useAuthStore';

function navLinkClass({ isActive }: { isActive: boolean }) {
    return [
        'relative py-1 transition-colors',
        isActive
            ? 'text-(--text-main) after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-(--text-main)'
            : 'text-(--text-sub) hover:text-(--text-main)',
    ].join(' ');
}

export default function Navbar() {
    const { isDark, toggleTheme } = useThemeStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!menuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [menuOpen]);

    const handleLogout = async () => {
        setMenuOpen(false);

        try {
            await apiClient.post('/auth/logout');
        } catch {
            // Local state must still be cleared if the server is unavailable.
        }

        logout();
        navigate('/');
    };

    const handleThemeToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        if (!document.startViewTransition || reducedMotion) {
            toggleTheme();
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const radius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );
        const root = document.documentElement;

        root.style.setProperty('--theme-origin-x', `${x}px`);
        root.style.setProperty('--theme-origin-y', `${y}px`);
        root.classList.add('theme-transitioning');

        const transition = document.startViewTransition(() => {
            flushSync(() => toggleTheme());
        });

        transition.ready
            .then(() => {
                root.animate(
                    {
                        clipPath: [
                            `circle(0px at ${x}px ${y}px)`,
                            `circle(${radius}px at ${x}px ${y}px)`,
                        ],
                    },
                    {
                        duration: 1200,
                        easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
                        fill: 'both',
                        pseudoElement: '::view-transition-new(root)',
                    }
                );
            })
            .catch(() => {});

        transition.finished.then(
            () => root.classList.remove('theme-transitioning'),
            () => root.classList.remove('theme-transitioning')
        );
    };

    const displayName =
        user ?
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            user.email
        :   '';

    const firstInitial = user?.firstName?.[0] || '';
    const lastInitial = user?.lastName?.[0] || '';
    const initials = (firstInitial + lastInitial).toUpperCase();

    const wilayaDisplay =
        user?.wilaya?.includes('-') ?
            user.wilaya.split('-')[1].trim()
        :   user?.wilaya || user?.role || '';

    const showUpgradeButton =
        Boolean(user) &&
        user?.subscriptionTier !== 'PRO' &&
        user?.subscriptionTier !== 'ENTERPRISE';

    return (
        <header className='sticky top-0 z-50 w-full shrink-0 border-b border-(--border-line) bg-(--bg-canvas)/95 backdrop-blur-sm transition-colors'>
            <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
                <div className='flex items-center'>
                    <Link
                        to='/'
                        className='inline-flex items-center px-3 py-1 font-grotesque font-bold text-3xl tracking-tight bg-(--btn-main-bg) text-(--btn-main-text) rounded-sm transition-colors'>
                        Skillora
                    </Link>
                </div>

                <nav className='hidden md:flex items-center space-x-8 text-sm font-medium'>
                    {!user && (
                        <>
                            <NavLink
                                to='/'
                                end
                                className={navLinkClass}>
                                Home
                            </NavLink>
                            <NavLink
                                to='/how-it-works'
                                className={navLinkClass}>
                                How It Works
                            </NavLink>
                            <NavLink
                                to='/pricing'
                                className={navLinkClass}>
                                Pricing
                            </NavLink>
                            <NavLink
                                to='/companies'
                                className={navLinkClass}>
                                Companies
                            </NavLink>
                            <NavLink
                                to='/about'
                                className={navLinkClass}>
                                About Us
                            </NavLink>
                        </>
                    )}

                    {user?.role === 'APPLICANT' && (
                        <>
                            <NavLink
                                to='/applicant/profiles'
                                className={navLinkClass}>
                                My Resumes
                            </NavLink>
                            <NavLink
                                to='/jobs'
                                className={navLinkClass}>
                                Jobs
                            </NavLink>
                            <NavLink
                                to='/applicant/insights'
                                className={navLinkClass}>
                                Insights
                            </NavLink>
                        </>
                    )}

                    {user?.role === 'RECRUITER' && (
                        <>
                            <NavLink
                                to='/recruiter/positions'
                                className={navLinkClass}>
                                Positions History
                            </NavLink>
                            <NavLink
                                to='/jobs'
                                className={navLinkClass}>
                                Public Jobs Preview
                            </NavLink>
                            <NavLink
                                to='/pricing'
                                className={navLinkClass}>
                                Plans
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className='flex items-center space-x-3'>
                    {user?.role === 'APPLICANT' && <MessagesMenu />}

                    {showUpgradeButton && (
                        <Link
                            to='/pricing'
                            className='whitespace-nowrap rounded-md bg-(--btn-main-bg) px-3 py-2 text-xs font-semibold text-(--btn-main-text) transition-opacity hover:opacity-90 sm:px-4 sm:text-sm'>
                            {user?.role === 'RECRUITER' ?
                                'Upgrade Plan'
                            :   'Upgrade to Pro'}
                        </Link>
                    )}

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
                    :   <div
                            ref={menuRef}
                            className='relative flex items-center gap-1 pl-3 border-l border-(--border-line)'>
                            <button
                                type='button'
                                onClick={() => {
                                    setMenuOpen(false);
                                    navigate(roleHome[user.role]);
                                }}
                                aria-label='Go to dashboard'
                                className='flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-(--bg-panel) transition-colors cursor-pointer'>
                                <div className='w-8 h-8 rounded-full bg-(--bg-panel) border border-(--border-line) flex items-center justify-center font-grotesque font-bold text-sm text-(--text-main)'>
                                    {initials || <UserIcon size={14} />}
                                </div>
                                <div className='hidden sm:block text-left'>
                                    <div className='text-xs font-semibold leading-tight text-(--text-main)'>
                                        {displayName}
                                    </div>
                                    <div className='font-mono text-[10px] text-(--text-sub)'>
                                        {wilayaDisplay}
                                    </div>
                                </div>
                            </button>

                            <button
                                type='button'
                                onClick={() => setMenuOpen((open) => !open)}
                                aria-label={
                                    menuOpen ?
                                        'Close profile menu'
                                    :   'Open profile menu'
                                }
                                aria-haspopup='menu'
                                aria-expanded={menuOpen}
                                className='p-1.5 rounded-md text-(--text-sub) hover:text-(--text-main) hover:bg-(--bg-panel) transition-colors cursor-pointer'>
                                <ChevronDown
                                    size={15}
                                    className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            <div
                                role='menu'
                                aria-hidden={!menuOpen}
                                inert={!menuOpen}
                                className={`absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-md border border-(--border-line) bg-(--bg-canvas) p-1.5 shadow-lg transition-all duration-200 ease-out ${
                                    menuOpen ?
                                        'pointer-events-auto translate-y-0 scale-100 opacity-100'
                                    :   'pointer-events-none -translate-y-1 scale-95 opacity-0'
                                }`}>
                                <Link
                                    to={roleHome[user.role]}
                                    role='menuitem'
                                    onClick={() => setMenuOpen(false)}
                                    className='flex items-center gap-2 rounded px-3 py-2 text-sm text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                    <LayoutDashboard size={15} />
                                    Dashboard
                                </Link>
                                <Link
                                    to='/settings/profile'
                                    role='menuitem'
                                    onClick={() => setMenuOpen(false)}
                                    className='flex items-center gap-2 rounded px-3 py-2 text-sm text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                    <Pencil size={15} />
                                    Edit Profile
                                </Link>
                                <div className='my-1 border-t border-(--border-line)' />
                                <button
                                    type='button'
                                    role='menuitem'
                                    onClick={handleLogout}
                                    className='flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400'>
                                    <LogOut size={15} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    }

                    <button
                        type='button'
                        onClick={handleThemeToggle}
                        aria-label={
                            isDark ?
                                'Switch to light mode'
                            :   'Switch to dark mode'
                        }
                        className='p-2 rounded-md border border-(--border-line) text-(--text-sub) hover:text-(--text-main) hover:bg-(--bg-panel) transition-all flex items-center justify-center cursor-pointer'>
                        {isDark ?
                            <Sun size={17} />
                        :   <Moon size={17} />}
                    </button>
                </div>
            </div>
        </header>
    );
}
