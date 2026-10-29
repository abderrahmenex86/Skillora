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
import Footer from '../../components/Footer';
import MermaidDiagram from '../../components/MermaidDiagram';

const PROCESS_FLOW = `
flowchart TD
    A[Choose a role] --> B[Select qualifications]
    B --> C[Generate resume]
    C --> D{Ready to submit?}
    D -->|No| E[Add missing proof]
    E --> B
    D -->|Yes| F[Submit application]
    F --> G[Parse + normalize]
    G --> H[Audit against rubric]
    H --> I{Qualifications verified?}
    I -->|Yes| J[Unlock interview slots]
    J --> K[Calendar locked]
    I -->|No| L[Gap roadmap]
    L --> M[Re-apply with new proof]
    classDef accent fill:{{accent}},stroke:{{accent}},color:{{onAccent}};
    classDef soft fill:{{accentSoft}},stroke:{{muted}},color:{{accentText}};
    class F,J,K accent;
    class D,E,I,L,M soft;
`;

const STEPS = [
    {
        index: '01',
        label: 'Tailored resumes',
        title: 'Apply with the resume that fits the role.',
        description:
            'Keep one information library and assemble a role-specific resume for every application — data engineering, security, corporate counsel. The version you submit is the version Skillora audits.',
        icon: FileText,
    },
    {
        index: '02',
        label: 'Qualification audit',
        title: 'Every claim is checked against the rubric.',
        description:
            'Companies define mandatory criteria. Skillora normalizes each submission into a randomized candidate card, then audits projects, repos, and credentials against those criteria — not keyword density.',
        icon: SearchCheck,
    },
    {
        index: '03',
        label: 'A deterministic outcome',
        title: 'An interview or a concrete next step.',
        description:
            'Eligible applicants unlock calendar slots they can confirm from their dashboard. Redirected applicants receive a specific gap roadmap with the exact proof to build before re-applying.',
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
                        qualifications and a deterministic dual outcome: an
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
                            Qualifications, not adjectives
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
                            The full flow
                        </p>
                        <h2 className='mt-3 font-grotesque text-4xl font-extrabold leading-none tracking-tight text-(--text-main) sm:text-5xl'>
                            What happens under the hood.
                        </h2>
                    </div>

                    <div className='mt-10 grid gap-8 lg:grid-cols-12 lg:items-start'>
                        <div className='lg:col-span-5'>
                            <div className='rounded-xl border border-(--border-line) bg-(--bg-panel) p-3 sm:p-4'>
                                <MermaidDiagram
                                    chart={PROCESS_FLOW}
                                    label='End-to-end flowchart: tailor a resume, submit it for a qualification audit, then route to interview scheduling or an actionable gap roadmap.'
                                />
                            </div>
                        </div>

                        <div className='space-y-7 lg:col-span-7'>
                            <p className='text-sm leading-relaxed text-(--text-sub)'>
                                One pipeline, three stages. Every application
                                follows the same path — whether it ends in an
                                interview or a concrete plan to close the gap.
                            </p>

                            {STEPS.map((step) => {
                                const Icon = step.icon;

                                return (
                                    <div
                                        key={step.index}
                                        className='border-t border-(--border-line) pt-6'>
                                        <div className='flex items-center gap-3'>
                                            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-(--border-line) bg-(--bg-panel) text-(--text-main)'>
                                                <Icon
                                                    size={16}
                                                    aria-hidden='true'
                                                />
                                            </span>
                                            <div>
                                                <p className='font-mono text-[9px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                                    {step.index}
                                                </p>
                                                <p className='font-mono text-[9px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                                    {step.label}
                                                </p>
                                            </div>
                                        </div>
                                        <h3 className='mt-3 font-grotesque text-2xl font-bold text-(--text-main)'>
                                            {step.title}
                                        </h3>
                                        <p className='mt-2 text-sm leading-relaxed text-(--text-sub)'>
                                            {step.description}
                                        </p>
                                    </div>
                                );
                            })}

                            <div className='rounded-lg border border-(--border-line) bg-(--bg-panel) p-4'>
                                <p className='font-mono text-[9px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                    Outcome guarantee
                                </p>
                                <p className='mt-1 text-sm leading-relaxed text-(--text-main)'>
                                    No silent rejections. Every applicant leaves
                                    with an interview or a concrete next step.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
