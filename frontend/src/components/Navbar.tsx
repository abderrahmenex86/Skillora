import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';

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

    const handleLogout = () => {
        setMenuOpen(false);
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

    return (
        <header className='sticky top-0 z-50 w-full border-b border-(--border-line) bg-(--bg-canvas)/95 backdrop-blur-sm transition-colors'>
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
                                to='/applicant/profiles'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                Resume & Profiles
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
                        onClick={handleThemeToggle}
                        aria-label={
                            isDark ?
                                'Switch to light mode'
                            :   'Switch to dark mode'
                        }
                        className='p-2 rounded-md border border-(--border-line) text-(--text-sub) hover:text-(--text-main) hover:bg-(--bg-panel) transition-all flex items-center justify-center cursor-pointer'>
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
                                    Edit Personal Info
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
                </div>
            </div>
        </header>
    );
}
