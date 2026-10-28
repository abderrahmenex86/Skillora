import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function Logo({ className = '' }: { className?: string }) {
    return (
        <Link
            to='/'
            aria-label='Skillora home'
            className={`group inline-flex items-center gap-2.5 ${className}`}>
            <span className='relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 via-violet-accent to-pink-accent text-white shadow-[0_8px_20px_-8px_rgb(99_102_241/0.8)] transition-transform duration-300 group-hover:rotate-6'>
                <Sparkles
                    size={18}
                    strokeWidth={2.4}
                />
            </span>
            <span className='font-display text-xl font-extrabold tracking-tight text-(--text-main)'>
                Skillora
            </span>
        </Link>
    );
}

export function SiteFooter({ tagline }: { tagline?: string }) {
    return (
        <footer className='mt-auto border-t border-(--border-line)'>
            <div className='mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row'>
                <div className='flex items-center gap-3'>
                    <Logo />
                    <span className='hidden text-xs text-(--text-sub) sm:inline'>
                        © 2026 · Algeria Talent Infrastructure
                    </span>
                </div>
                <nav className='flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-(--text-sub)'>
                    <Link
                        to='/how-it-works'
                        className='transition-colors hover:text-(--text-main)'>
                        How it works
                    </Link>
                    <Link
                        to='/pricing'
                        className='transition-colors hover:text-(--text-main)'>
                        Pricing
                    </Link>
                    <Link
                        to='/companies'
                        className='transition-colors hover:text-(--text-main)'>
                        Companies
                    </Link>
                    <Link
                        to='/about'
                        className='transition-colors hover:text-(--text-main)'>
                        About
                    </Link>
                </nav>
                <div className='text-xs text-(--text-sub)'>
                    {tagline ?? 'Multilingual parsing · FR / EN / AR'}
                </div>
            </div>
        </footer>
    );
}
