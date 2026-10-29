import { Link } from 'react-router-dom';

/** Serif wordmark, like a magazine masthead. */
export function Logo({ className = '' }: { className?: string }) {
    return (
        <Link
            to='/'
            aria-label='Skillora home'
            className={`group inline-flex items-baseline ${className}`}>
            <span className='display text-[1.9rem] leading-none text-(--text-main)'>
                Skillora
            </span>
            <span className='ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-(--text-main) transition-transform duration-500 group-hover:scale-150' />
        </Link>
    );
}

/** Thin masthead strip: issue line between two rules. */
export function Masthead({ left, right }: { left: string; right: string }) {
    return (
        <div className='kicker flex items-center gap-4 py-3'>
            <span className='whitespace-nowrap'>{left}</span>
            <span className='hairline' />
            <span className='whitespace-nowrap'>{right}</span>
        </div>
    );
}

export function SiteFooter({ tagline }: { tagline?: string }) {
    return (
        <footer className='mt-auto'>
            <div className='mx-auto w-full max-w-6xl px-6'>
                <div className='hairline-ink' />
                <div className='grid grid-cols-1 gap-10 py-14 md:grid-cols-12'>
                    <div className='md:col-span-5'>
                        <Logo />
                        <p className='mt-4 max-w-xs text-sm font-light leading-relaxed text-(--text-sub)'>
                            {tagline ??
                                'The recruiting pipeline that never ghosts a candidate.'}
                        </p>
                    </div>
                    <nav className='grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:col-span-4'>
                        <span className='kicker col-span-2 mb-1'>
                            Explore
                        </span>
                        <Link
                            to='/how-it-works'
                            className='link-underline w-fit'>
                            How it works
                        </Link>
                        <Link
                            to='/pricing'
                            className='link-underline w-fit'>
                            Pricing
                        </Link>
                        <Link
                            to='/companies'
                            className='link-underline w-fit'>
                            Companies
                        </Link>
                        <Link
                            to='/about'
                            className='link-underline w-fit'>
                            About
                        </Link>
                    </nav>
                    <div className='md:col-span-3 md:text-right'>
                        <span className='kicker'>Colophon</span>
                        <p className='mt-3 text-sm font-light leading-relaxed text-(--text-sub)'>
                            Algiers, Algeria
                            <br />
                            FR · EN · AR
                            <br />© 2026 Skillora
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

/** Editorial page opener: kicker, large serif title, italic accent, lead. */
export function ChapterHeader({
    eyebrow,
    number,
    title,
    accent,
    children,
}: {
    eyebrow: string;
    number?: string;
    title: string;
    accent?: string;
    children?: React.ReactNode;
}) {
    return (
        <section className='mx-auto w-full max-w-6xl px-6 pt-10'>
            <Masthead
                left={eyebrow}
                right={number ?? 'Skillora · 2026'}
            />
            <div className='animate-fade-up relative grid grid-cols-1 gap-10 pb-16 pt-14 md:grid-cols-12 md:pt-20'>
                <div
                    aria-hidden='true'
                    className='glow left-1/4! right-0! top-0! -z-10'
                />
                <h1 className='display text-6xl text-(--text-main) sm:text-7xl md:col-span-9 md:text-[6.5rem]'>
                    {title}
                    {accent && (
                        <>
                            {' '}
                            <em className='italic'>{accent}</em>
                        </>
                    )}
                </h1>
                {children && (
                    <div className='lead max-w-md md:col-span-6 md:col-start-7'>
                        {children}
                    </div>
                )}
            </div>
            <div className='hairline' />
        </section>
    );
}
