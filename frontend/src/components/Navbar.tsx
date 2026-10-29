import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import {
    ChevronDown,
    Menu,
    X,
    LayoutDashboard,
    LogOut,
    Moon,
    Pencil,
    Sun,
    User as UserIcon,
} from 'lucide-react';
import { roleHome } from '../data/routes';
import { Logo } from './Brand';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';

function navLinkClass({ isActive }: { isActive: boolean }) {
    return [
        'relative py-1 text-[0.7rem] uppercase tracking-[0.2em] transition-colors duration-300 after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:bg-(--text-main) after:transition-transform after:duration-500',
        isActive
            ? 'text-(--text-main) after:scale-x-100'
            : 'text-(--text-sub) hover:text-(--text-main) after:scale-x-0 hover:after:scale-x-100',
    ].join(' ');
}

function mobileLinkClass({ isActive }: { isActive: boolean }) {
    return [
        'block border-b border-(--border-line) px-1 py-4 font-serif text-2xl transition-colors',
        isActive
            ? 'italic text-(--text-main)'
            : 'text-(--text-main) hover:bg-(--bg-panel)',
    ].join(' ');
}

export default function Navbar() {
    const { isDark, toggleTheme } = useThemeStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMenuOpen(false);
        setMobileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

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

    const showUpgradeButton =
        Boolean(user) &&
        user?.subscriptionTier !== 'PRO' &&
        user?.subscriptionTier !== 'ENTERPRISE';



    const links: Array<{ to: string; label: string; end?: boolean }> =
        !user ?
            [
                { to: '/', label: 'Home', end: true },
                { to: '/how-it-works', label: 'How It Works' },
                { to: '/pricing', label: 'Pricing' },
                { to: '/companies', label: 'Companies' },
                { to: '/about', label: 'About Us' },
            ]
        : user.role === 'APPLICANT' ?
            [
                { to: '/applicant/profiles', label: 'Resume Builder' },
                { to: '/jobs', label: 'Open Positions' },
                { to: '/applicant/insights', label: 'Insights' },
            ]
        :   [
                { to: '/recruiter/positions', label: 'Positions History' },
                { to: '/jobs', label: 'Public Jobs Preview' },
                { to: '/pricing', label: 'Plans' },
            ];

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${
                scrolled ?
                    'glass border-b border-(--border-line)'
                :   'border-b border-transparent'
            }`}>
            <div className='mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-6'>
                <Logo />

                <nav className='hidden items-center gap-9 lg:flex'>
                    {links.map((link) => (
                        <NavLink
                            key={link.to + link.label}
                            to={link.to}
                            end={link.end}
                            className={navLinkClass}>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className='flex items-center gap-2'>
                    {showUpgradeButton && (
                        <Link
                            to='/pricing'
                            className='btn-secondary hidden! px-4! py-2.5! sm:inline-flex!'>
                                                        Upgrade to Pro
                        </Link>
                    )}

                    {!user ?
                        <>
                            <Link
                                to='/auth?mode=login'
                                className='link-underline hidden text-[0.7rem] uppercase tracking-[0.2em] text-(--text-main) sm:inline-flex'>
                                Login
                            </Link>
                            <Link
                                to='/auth?mode=register'
                                className='btn-primary px-5! py-2.5!'>
                                Get started
                            </Link>
                        </>
                    :   <div
                            ref={menuRef}
                            className='relative'>
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
                                className='flex items-center gap-2 rounded-full border border-(--border-line) py-1 pl-1 pr-2.5 transition-colors hover:border-(--text-main)'>
                                <span className='flex h-8 w-8 items-center justify-center rounded-full bg-(--text-main) font-serif text-sm text-(--bg-canvas)'>
                                    {initials || <UserIcon size={14} />}
                                </span>
                                <span className='hidden text-left sm:block'>
                                    <span className='block max-w-[9rem] truncate text-xs font-semibold leading-tight text-(--text-main)'>
                                        {displayName}
                                    </span>
                                    <span className='block text-[10px] leading-tight text-(--text-sub)'>
                                        {wilayaDisplay}
                                    </span>
                                </span>
                                <ChevronDown
                                    size={14}
                                    className={`text-(--text-sub) transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            <div
                                role='menu'
                                aria-hidden={!menuOpen}
                                inert={!menuOpen}
                                className={`absolute right-0 top-full z-50 mt-2 w-60 origin-top-right border border-(--border-line) bg-(--bg-elevated) p-2 shadow-lg transition-all duration-200 ease-out ${
                                    menuOpen ?
                                        'pointer-events-auto translate-y-0 scale-100 opacity-100'
                                    :   'pointer-events-none -translate-y-1 scale-95 opacity-0'
                                }`}>
                                <div className='mb-1 border-b border-(--border-line) px-3 pb-2.5 pt-1.5'>
                                    <div className='truncate text-sm font-semibold text-(--text-main)'>
                                        {displayName}
                                    </div>
                                    <div className='truncate text-xs text-(--text-sub)'>
                                        {user.email}
                                    </div>
                                </div>
                                <Link
                                    to={roleHome[user.role]}
                                    role='menuitem'
                                    onClick={() => setMenuOpen(false)}
                                    className='flex items-center gap-2.5 px-3 py-2 text-sm text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                    <LayoutDashboard size={15} />
                                    Dashboard
                                </Link>
                                <Link
                                    to='/settings/profile'
                                    role='menuitem'
                                    onClick={() => setMenuOpen(false)}
                                    className='flex items-center gap-2.5 px-3 py-2 text-sm text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                    <Pencil size={15} />
                                    Edit Profile
                                </Link>
                                <div className='my-1 border-t border-(--border-line)' />
                                <button
                                    type='button'
                                    role='menuitem'
                                    onClick={handleLogout}
                                    className='flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400'>
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
                        className='flex h-9 w-9 items-center justify-center rounded-full border border-(--border-line) text-(--text-sub) transition-all hover:text-(--text-main) hover:border-(--text-main)'>
                        {isDark ?
                            <Sun
                                size={16}
                                className='text-(--text-main)'
                            />
                        :   <Moon size={16} />}
                    </button>

                    <button
                        type='button'
                        onClick={() => setMobileOpen((open) => !open)}
                        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileOpen}
                        className='flex h-9 w-9 items-center justify-center rounded-full border border-(--border-line) text-(--text-main) lg:hidden'>
                        {mobileOpen ?
                            <X size={16} />
                        :   <Menu size={16} />}
                    </button>
                </div>
            </div>

            <div
                className={`overflow-hidden border-(--border-line) transition-[max-height,opacity] duration-300 lg:hidden ${
                    mobileOpen ?
                        'glass max-h-[28rem] border-t opacity-100'
                    :   'max-h-0 opacity-0'
                }`}
                inert={!mobileOpen}>
                <nav className='mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3'>
                    {links.map((link) => (
                        <NavLink
                            key={link.to + link.label}
                            to={link.to}
                            end={link.end}
                            className={mobileLinkClass}>
                            {link.label}
                        </NavLink>
                    ))}
                    {!user && (
                        <NavLink
                            to='/auth?mode=login'
                            className={mobileLinkClass}>
                            Login
                        </NavLink>
                    )}
                    {showUpgradeButton && (
                        <Link
                            to='/pricing'
                            className='btn-secondary mt-4'>
                                                        Upgrade to Pro
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
