import { Link } from 'react-router-dom';
import {
    ArrowRight,
    ArrowUpRight,
    CalendarCheck2,
    FileText,
    Route,
    SearchCheck,
    ShieldCheck,
} from 'lucide-react';

const STEPS = [
    {
        index: '01',
        label: 'Tailored resumes',
        title: 'Apply with the resume that fits the role.',
        description:
            'Applicants keep dedicated resumes for each discipline — data engineering, security, corporate counsel — with role-specific summaries, projects, repos, and credentials. The version you choose is the version Skillora audits.',
        icon: FileText,
    },
    {
        index: '02',
        label: 'Evidence audit',
        title: 'Every claim is checked against the rubric.',
        description:
            'Companies define mandatory criteria. Skillora normalizes submissions into randomized candidate cards, then audits artifacts, public work, and degree credentials against those criteria — not keyword density.',
        icon: SearchCheck,
    },
    {
        index: '03',
        label: 'A deterministic outcome',
        title: 'An interview or a concrete next step.',
        description:
            'Eligible applicants receive calendar slots they can confirm from their dashboard. Redirected applicants receive a specific gap analysis with the exact proof to build before re-applying.',
        icon: Route,
    },
];

export default function HowItWorksView() {
    return (
        <div className='page-scroll flex flex-col'>
            <main className='mx-auto w-full max-w-6xl px-6 py-16'>
                <header className='max-w-3xl'>
                    <p className='font-mono text-[10px] uppercase tracking-[0.22em] text-(--text-sub)'>
                        How it works
                    </p>
                    <h1 className='mt-4 font-grotesque text-5xl font-extrabold leading-[0.95] tracking-tight text-(--text-main) sm:text-6xl'>
                        From resume to verdict.
                        <span className='block text-(--text-sub)'>
                            No dead ends.
                        </span>
                    </h1>
                    <p className='mt-6 max-w-2xl text-lg leading-relaxed text-(--text-sub)'>
                        Skillora replaces keyword filtering with verified
                        evidence and a deterministic dual outcome: an
                        interview invitation or an actionable gap roadmap.
                    </p>

                    <div className='mt-8 flex flex-wrap items-center gap-3'>
                        <Link
                            to='/auth?mode=register'
                            className='inline-flex items-center gap-2 rounded-md bg-(--btn-main-bg) px-5 py-3 font-grotesque text-lg font-bold text-(--btn-main-text) transition-opacity hover:opacity-90'>
                            Build Your Resume
                            <ArrowRight
                                size={17}
                                aria-hidden='true'
                            />
                        </Link>
                        <Link
                            to='/jobs'
                            className='inline-flex items-center gap-1.5 rounded-md border border-(--border-line) px-4 py-3 text-sm font-semibold text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                            Explore open roles
                            <ArrowUpRight
                                size={14}
                                aria-hidden='true'
                            />
                        </Link>
                    </div>

                    <div className='mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-(--border-line) pt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-(--text-sub)'>
                        <span className='inline-flex items-center gap-2'>
                            <ShieldCheck
                                size={13}
                                className='text-forest dark:text-forest-dark'
                                aria-hidden='true'
                            />
                            Evidence, not adjectives
                        </span>
                        <span className='inline-flex items-center gap-2'>
                            <CalendarCheck2
                                size={13}
                                className='text-forest dark:text-forest-dark'
                                aria-hidden='true'
                            />
                            Scheduling included
                        </span>
                        <span className='inline-flex items-center gap-2'>
                            <Route
                                size={13}
                                className='text-forest dark:text-forest-dark'
                                aria-hidden='true'
                            />
                            Every applicant gets a verdict
                        </span>
                    </div>
                </header>

                <section className='mt-16 border-t border-(--border-line) pt-12'>
                    <div className='max-w-2xl'>
                        <p className='font-mono text-[10px] uppercase tracking-[0.22em] text-(--text-sub)'>
                            The three moves
                        </p>
                        <h2 className='mt-3 font-grotesque text-4xl font-extrabold leading-none tracking-tight text-(--text-main) sm:text-5xl'>
                            What happens under the hood.
                        </h2>
                    </div>

                    <div className='mt-10 space-y-10'>
                        {STEPS.map((step) => {
                            const Icon = step.icon;

                            return (
                                <div
                                    key={step.index}
                                    className='grid grid-cols-1 gap-6 border-t border-(--border-line) pt-8 md:grid-cols-12 md:items-start'>
                                    <div className='flex items-center gap-3 md:col-span-3'>
                                        <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-(--border-line) bg-(--bg-panel) text-(--text-main)'>
                                            <Icon
                                                size={18}
                                                aria-hidden='true'
                                            />
                                        </span>
                                        <div>
                                            <p className='font-mono text-[10px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                                {step.index}
                                            </p>
                                            <p className='font-mono text-[10px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                                {step.label}
                                            </p>
                                        </div>
                                    </div>
                                    <div className='md:col-span-9'>
                                        <h3 className='font-grotesque text-3xl font-bold text-(--text-main)'>
                                            {step.title}
                                        </h3>
                                        <p className='mt-2 max-w-3xl text-sm leading-relaxed text-(--text-sub)'>
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className='mt-16 border-t border-(--border-line) pt-10'>
                    <Link
                        to='/auth?mode=register'
                        className='inline-flex items-center gap-2 rounded-md bg-(--btn-main-bg) px-6 py-3.5 font-grotesque text-xl font-bold text-(--btn-main-text) transition-opacity hover:opacity-90'>
                        Build Your Resume
                        <ArrowRight
                            size={18}
                            aria-hidden='true'
                        />
                    </Link>
                </div>
            </main>
        </div>
    );
}
