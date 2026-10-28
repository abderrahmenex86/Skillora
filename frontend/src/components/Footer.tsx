import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className='shrink-0 border-t border-(--border-line) bg-(--bg-canvas)'>
            <div className='mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-1 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-(--text-sub) sm:flex-row'>
                <span>
                    Skillora © {new Date().getFullYear()} • Multilingual parsing
                    (FR/EN/AR)
                </span>
                <span className='flex items-center gap-4'>
                    <Link
                        to='/about'
                        className='transition-colors hover:text-(--text-main)'>
                        About
                    </Link>
                    <Link
                        to='/pricing'
                        className='transition-colors hover:text-(--text-main)'>
                        Plans
                    </Link>
                    <span>[Algeria Talent Infrastructure]</span>
                </span>
            </div>
        </footer>
    );
}
