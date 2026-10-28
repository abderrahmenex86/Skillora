import { Link } from 'react-router-dom';
import { CornerDownRight } from 'lucide-react';

/** Wordmark + orbit mark, from the deck's title slide. */
export function Logo({ className = '' }: { className?: string }) {
    return (
        <Link
            to='/'
            aria-label='Skillora home'
            className={`group inline-flex items-center gap-2.5 ${className}`}>
            <span className='relative inline-flex h-8 w-8 items-center justify-center rounded-[0.65rem] bg-ink ring-1 ring-emerald-brand/40 transition-transform duration-300 group-hover:rotate-12 dark:bg-ink-2'>
                <span className='absolute inset-[5px] rounded-[0.45rem] border border-emerald-brand/40' />
                <span className='h-2 w-2 rounded-full bg-emerald-brand shadow-[0_0_10px_2px_rgb(16_185_129/0.7)]' />
                <span className='absolute left-[3px] top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-amber-soft' />
            </span>
            <span className='font-display text-[1.75rem] font-extrabold leading-none tracking-tight text-(--text-main)'>
                Skillora
            </span>
        </Link>
    );
}

export function SiteFooter({ tagline }: { tagline?: string }) {
    return (
        <footer className='mt-auto border-t border-(--border-line)'>
            <div className='mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-7 sm:flex-row'>
                <span className='eyebrow'>Skillora</span>
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
                <span className='text-xs text-(--text-sub)'>
                    {tagline ?? '© 2026 · Multilingual parsing FR / EN / AR'}
                </span>
            </div>
        </footer>
    );
}

/** Small "chapter" title block used at the top of inner pages. */
export function ChapterHeader({
    eyebrow,
    title,
    accent,
    children,
    tone = 'emerald',
}: {
    eyebrow: string;
    title: string;
    accent?: string;
    children?: React.ReactNode;
    tone?: 'emerald' | 'amber';
}) {
    return (
        <section className='mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6'>
            <div
                className={`panel-dark rounded-3xl px-7 py-14 sm:px-12 md:py-20 ${
                    tone === 'amber' ? 'panel-dark-amber' : ''
                }`}>
                <div
                    aria-hidden='true'
                    className='orbit -right-24 -top-24 hidden h-96 w-96 md:block'
                />
                <div
                    aria-hidden='true'
                    className='orbit -right-4 -top-4 hidden h-56 w-56 md:block'
                />
                <div className='animate-fade-up relative max-w-3xl'>
                    <span
                        className={`eyebrow ${tone === 'amber' ? 'eyebrow-amber' : ''}`}>
                        {eyebrow}
                    </span>
                    <h1 className='display mt-3 text-6xl text-white sm:text-7xl md:text-8xl'>
                        {title}
                        {accent && (
                            <>
                                {' '}
                                <span className='text-emerald-brand'>
                                    {accent}
                                </span>
                            </>
                        )}
                    </h1>
                    {children && (
                        <div className='mt-6 max-w-2xl text-lg leading-relaxed text-sage-400'>
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

const PIPELINE = [
    { n: '01', title: 'Untrusted PDF résumé', sub: 'Raw input', dashed: true },
    { n: '02', title: 'Gatekeeper Agent', sub: 'Hard criteria check', edge: 'Eligible' },
    { n: '03', title: 'Candidate Pool', sub: 'State database', edge: 'Deadline' },
    { n: '04', title: 'Cohort Agent', sub: 'Comparative ranking', edge: 'Top N' },
    { n: '05', title: 'Logistics Agent', sub: 'Human in the loop' },
    { n: '06', title: 'Verified interview', sub: 'Meet · Zoom · Onsite', final: true },
];

/** The deck's "From PDF to interview, on autopilot" flow. */
export function PipelineFlow() {
    return (
        <div>
            <ol className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
                {PIPELINE.map((step) => (
                    <li
                        key={step.n}
                        className={`relative flex min-h-32 flex-col rounded-xl p-4 transition-transform duration-300 hover:-translate-y-1 ${
                            step.final ?
                                'bg-emerald-brand text-ink shadow-[0_0_40px_-6px_rgb(16_185_129/0.7)]'
                            : step.dashed ?
                                'border border-dashed border-white/25 text-white'
                            :   'border border-white/10 bg-white/[0.04] text-white'
                        }`}>
                        {step.edge && (
                            <span className='absolute -top-5 right-0 hidden text-[10px] font-bold text-emerald-brand lg:block'>
                                {step.edge}
                            </span>
                        )}
                        <span
                            className={`text-[11px] font-bold ${step.final ? 'text-ink/70' : 'text-sage-400'}`}>
                            {step.n}
                        </span>
                        <span className='mt-1 font-display text-xl font-extrabold leading-tight'>
                            {step.title}
                        </span>
                        <span
                            className={`mt-auto pt-2 text-xs ${step.final ? 'text-ink/75' : 'text-sage-400'}`}>
                            {step.sub}
                        </span>
                    </li>
                ))}
            </ol>
            <div className='mt-5 flex items-start gap-3 sm:ml-[calc(16.6%+0.5rem)]'>
                <CornerDownRight
                    size={18}
                    className='mt-2 shrink-0 text-amber-soft'
                />
                <div className='rounded-xl border border-amber-soft/40 bg-amber-accent/10 px-4 py-3 text-sm text-white'>
                    <span className='mr-2 text-[10px] font-bold uppercase tracking-wider text-amber-soft'>
                        Fails criteria
                    </span>
                    <span className='font-semibold'>Early rejection</span>,
                    always with actionable feedback.
                </div>
            </div>
        </div>
    );
}
