import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import {
    ChevronDown,
    LayoutDashboard,
    Lock,
    LogOut,
    Menu,
    Moon,
    Pencil,
    Sun,
    User as UserIcon,
    X,
} from 'lucide-react';
import { roleHome } from '../data/routes';
import { apiClient } from '../api/apiClient';
import { useThemeStore } from '../store/useThemeStore';
import MessagesMenu from './MessagesMenu';
import { useAuthStore } from '../store/useAuthStore';

function navLinkClass({ isActive }: { isActive: boolean }) {
    return [
        'relative whitespace-nowrap py-1 transition-colors',
        isActive
            ? 'text-(--text-main) after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-(--text-main)'
            : 'text-(--text-sub) hover:text-(--text-main)',
    ].join(' ');
}

function mobileNavLinkClass({ isActive }: { isActive: boolean }) {
    return [
        'flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium transition-colors',
        isActive
            ? 'bg-(--bg-panel) text-(--text-main)'
            : 'text-(--text-sub) hover:bg-(--bg-panel) hover:text-(--text-main)',
    ].join(' ');
}

type NavItem = {
    to: string;
    label: string;
    end?: boolean;
};

const publicItems: NavItem[] = [
    { to: '/', label: 'Home', end: true },
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/companies', label: 'Companies' },
    { to: '/about', label: 'About Us' },
];

const applicantItems: NavItem[] = [
    { to: '/applicant/dashboard', label: 'Dashboard' },
    { to: '/applicant/profiles', label: 'My Resumes' },
    { to: '/jobs', label: 'Jobs' },
    { to: '/applicant/insights', label: 'Insights' },
];

const recruiterItems: NavItem[] = [
    { to: '/recruiter/positions', label: 'Positions History' },
    { to: '/jobs', label: 'Public Jobs Preview' },
    { to: '/pricing', label: 'Plans' },
];

export default function Navbar() {
    const { isDark, toggleTheme } = useThemeStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const mobileNavRef = useRef<HTMLDivElement>(null);
    const mobileNavButtonRef = useRef<HTMLButtonElement>(null);

    const navItems =
        !user ? publicItems
        : user.role === 'APPLICANT' ? applicantItems
        : user.role === 'RECRUITER' ? recruiterItems
        : [];

    const isProLocked = (item: NavItem) =>
        item.to === '/applicant/insights' &&
        user?.subscriptionTier === 'FREE';

    const navLabel = (item: NavItem) => (
        <span className='inline-flex items-center gap-1.5'>
            {item.label}
            {isProLocked(item) && (
                <span
                    role='img'
                    aria-label='Pro feature'
                    className='inline-flex text-(--text-sub)'>
                    <Lock
                        size={11}
                        aria-hidden='true'
                    />
                </span>
            )}
        </span>
    );

    useEffect(() => {
        setMenuOpen(false);
        setMobileNavOpen(false);
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

    useEffect(() => {
        if (!mobileNavOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMobileNavOpen(false);
                mobileNavButtonRef.current?.focus();
                return;
            }

            if (event.key !== 'Tab') return;

            const focusable = mobileNavRef.current?.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled])'
            );
            if (!focusable?.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        const firstFocusable =
            mobileNavRef.current?.querySelector<HTMLElement>(
                'a[href], button:not([disabled])'
            );
        firstFocusable?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [mobileNavOpen]);

    const handleLogout = async () => {
        setMenuOpen(false);
        setMobileNavOpen(false);

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

    const mobileDrawer = mobileNavOpen ? (
        <div className='fixed inset-0 top-16 z-[60] md:hidden'>
            <div
                className='absolute inset-0 bg-black/50'
                aria-hidden='true'
                onClick={() => setMobileNavOpen(false)}
            />
            <div
                id='mobile-navigation'
                ref={mobileNavRef}
                role='dialog'
                aria-modal='true'
                aria-label='Navigation menu'
                className='absolute inset-y-0 right-0 flex w-[min(20rem,calc(100vw-3rem))] flex-col overflow-y-auto border-l border-(--border-line) bg-(--bg-canvas) p-5 shadow-2xl'>
                <div className='flex items-center justify-between border-b border-(--border-line) pb-4'>
                    <span className='font-mono text-[10px] uppercase tracking-[0.16em] text-(--text-sub)'>
                        Menu
                    </span>
                    <button
                        type='button'
                        onClick={() => {
                            setMobileNavOpen(false);
                            mobileNavButtonRef.current?.focus();
                        }}
                        aria-label='Close navigation menu'
                        className='rounded-md p-1.5 text-(--text-sub) transition-colors hover:bg-(--bg-panel) hover:text-(--text-main)'>
                        <X size={18} />
                    </button>
                </div>

                <nav className='mt-4 flex flex-col gap-1'>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={mobileNavLinkClass}>
                            {navLabel(item)}
                        </NavLink>
                    ))}
                </nav>

                {user && (
                    <div className='mt-4 border-t border-(--border-line) pt-4'>
                        <Link
                            to='/settings/profile'
                            className='flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                            <Pencil size={15} />
                            Edit Profile
                        </Link>
                        <button
                            type='button'
                            onClick={handleLogout}
                            className='flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400'>
                            <LogOut size={15} />
                            Logout
                        </button>
                    </div>
                )}

                {!user && (
                    <div className='mt-4 border-t border-(--border-line) pt-4'>
                        <Link
                            to='/auth?mode=login'
                            className='flex items-center justify-center rounded-md border border-(--border-line) px-3 py-2.5 text-sm font-medium text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                            Login
                        </Link>
                        <Link
                            to='/auth?mode=register'
                            className='mt-2 flex items-center justify-center rounded-md bg-(--btn-main-bg) px-3 py-2.5 text-sm font-medium text-(--btn-main-text) transition-opacity hover:opacity-90'>
                            Register
                        </Link>
                    </div>
                )}

                <div className='mt-4 border-t border-(--border-line) pt-4'>
                    {showUpgradeButton && (
                        <Link
                            to='/pricing'
                            className='mb-2 flex items-center justify-center rounded-md bg-(--btn-main-bg) px-3 py-2.5 text-sm font-medium text-(--btn-main-text) transition-opacity hover:opacity-90'>
                            {user?.role === 'RECRUITER' ?
                                'Upgrade Plan'
                            :   'Upgrade to Pro'}
                        </Link>
                    )}
                    <button
                        type='button'
                        onClick={handleThemeToggle}
                        aria-label={
                            isDark ?
                                'Switch to light mode'
                            :   'Switch to dark mode'
                        }
                        className='flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                        <span className='flex items-center gap-2'>
                            {isDark ?
                                <Sun size={16} />
                            :   <Moon size={16} />}
                            {isDark ? 'Light mode' : 'Dark mode'}
                        </span>
                        <span className='font-mono text-[10px] uppercase tracking-[0.12em] text-(--text-sub)'>
                            Switch
                        </span>
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <header className='sticky top-0 z-50 w-full shrink-0 border-b border-(--border-line) bg-(--bg-canvas)/95 backdrop-blur-sm transition-colors'>
            <div className='mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6'>
                <div className='flex min-w-0 shrink-0 items-center'>
                    <Link
                        to={user ? roleHome[user.role] : '/'}
                        className='inline-flex items-center px-2.5 py-1 font-grotesque text-3xl font-bold tracking-tight bg-(--btn-main-bg) text-(--btn-main-text) rounded-sm transition-colors sm:px-3'>
                        Skillora
                    </Link>
                </div>

                <nav className='hidden items-center gap-4 text-sm font-medium md:flex lg:gap-8'>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={navLinkClass}>
                            {navLabel(item)}
                        </NavLink>
                    ))}
                </nav>

                <div className='flex shrink-0 items-center gap-1.5 sm:gap-2'>
                    {user?.role === 'APPLICANT' && <MessagesMenu />}

                    {showUpgradeButton && (
                        <Link
                            to='/pricing'
                            className='hidden whitespace-nowrap rounded-md bg-(--btn-main-bg) px-4 py-2 text-sm font-semibold text-(--btn-main-text) transition-opacity hover:opacity-90 lg:inline-flex'>
                            {user?.role === 'RECRUITER' ?
                                'Upgrade Plan'
                            :   'Upgrade to Pro'}
                        </Link>
                    )}

                    {!user ?
                        <>
                            <Link
                                to='/auth?mode=login'
                                className='inline-flex px-2.5 py-2 text-sm font-medium rounded-md border border-(--border-line) text-(--text-main) hover:bg-(--bg-panel) transition-colors sm:px-3'>
                                Login
                            </Link>
                            <Link
                                to='/auth?mode=register'
                                className='px-2.5 py-2 text-sm font-medium rounded-md bg-(--btn-main-bg) text-(--btn-main-text) hover:opacity-90 transition-opacity sm:px-3'>
                                Register
                            </Link>
                        </>
                    :   <div
                            ref={menuRef}
                            className='relative flex items-center gap-1 border-l border-(--border-line) pl-2 sm:pl-3'>
                            <button
                                type='button'
                                onClick={() => {
                                    setMenuOpen(false);
                                    navigate(roleHome[user.role]);
                                }}
                                aria-label='Go to dashboard'
                                className='flex items-center space-x-2 rounded-md px-1.5 py-1 hover:bg-(--bg-panel) transition-colors cursor-pointer sm:px-2'>
                                <div className='w-8 h-8 rounded-full bg-(--bg-panel) border border-(--border-line) flex items-center justify-center font-grotesque font-bold text-sm text-(--text-main)'>
                                    {initials || <UserIcon size={14} />}
                                </div>
                                <div className='hidden lg:block text-left'>
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
                                className='hidden p-1.5 rounded-md text-(--text-sub) hover:text-(--text-main) hover:bg-(--bg-panel) transition-colors cursor-pointer sm:inline-flex'>
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
                        className='hidden p-2 rounded-md border border-(--border-line) text-(--text-sub) hover:text-(--text-main) hover:bg-(--bg-panel) transition-all md:flex items-center justify-center cursor-pointer'>
                        {isDark ?
                            <Sun size={17} />
                        :   <Moon size={17} />}
                    </button>

                    <button
                        ref={mobileNavButtonRef}
                        type='button'
                        onClick={() => setMobileNavOpen((open) => !open)}
                        aria-label={
                            mobileNavOpen ?
                                'Close navigation menu'
                            :   'Open navigation menu'
                        }
                        aria-expanded={mobileNavOpen}
                        aria-controls='mobile-navigation'
                        className='rounded-md border border-(--border-line) p-2 text-(--text-main) transition-colors hover:bg-(--bg-panel) md:hidden'>
                        {mobileNavOpen ?
                            <X size={18} />
                        :   <Menu size={18} />}
                    </button>
                </div>
            </div>
            {mobileDrawer && createPortal(mobileDrawer, document.body)}
        </header>
    );
}
