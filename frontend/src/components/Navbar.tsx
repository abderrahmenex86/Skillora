import { Link, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { Sun, Moon, LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
    const { isDark, toggleTheme } = useThemeStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
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
                                to='/applicant/dashboard'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                Dashboard & Calendar
                            </Link>
                            <Link
                                to='/applicant/profiles'
                                className='text-(--text-sub) hover:text-(--text-main) transition-colors'>
                                Evidence Vault & Personas
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
                    :   <div className='flex items-center space-x-3 pl-2 border-l border-(--border-line)'>
                            <div className='flex items-center space-x-2'>
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
                            </div>

                            <button
                                onClick={handleLogout}
                                title='Log out'
                                className='p-1.5 rounded-md border border-(--border-line) text-(--text-sub) hover:text-red-600 hover:bg-(--bg-panel) transition-colors cursor-pointer'>
                                <LogOut size={15} />
                            </button>
                        </div>
                    }
                </div>
            </div>
        </header>
    );
}
