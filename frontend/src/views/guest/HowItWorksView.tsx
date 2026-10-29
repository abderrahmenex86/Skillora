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

const STEPS = [
    {
        index: '01',
        label: 'Tailored resumes',
        title: 'Apply with the resume that fits the role.',
        icon: FileText,
        chart: `
flowchart TD
    A[Choose a role] --> B[Select evidence]
    B --> C[Generate resume]
    C --> D(Requirements met?)
    D -->|Yes| E[Submit for audit]
    D -->|No| F[Add missing proof]
    F --> B
    classDef accent fill:{{accent}},stroke:{{accent}},color:#ffffff;
    classDef soft fill:{{accentSoft}},stroke:{{accent}},color:{{accentText}};
    class E accent;
    class D,F soft;
`,
        diagramLabel:
            'Flowchart of resume tailoring: choose a role, select evidence, generate a resume, and either submit it or add missing proof before regenerating it.',
    },
    {
        index: '02',
        label: 'Evidence audit',
        title: 'Every claim is checked against the rubric.',
        icon: SearchCheck,
        chart: `
flowchart TD
    A[Submission received] --> B[Parse FR / EN / AR]
    B --> C[Normalize candidate card]
    C --> D[Compare with rubric]
    D --> E(Evidence verified?)
    E -->|Yes| F[Evidence score]
    E -->|No| G[Missing evidence logged]
    classDef accent fill:{{accent}},stroke:{{accent}},color:#ffffff;
    classDef soft fill:{{accentSoft}},stroke:{{accent}},color:{{accentText}};
    class F accent;
    class E,G soft;
`,
        diagramLabel:
            'Flowchart of the evidence audit: a submission is parsed, normalized into a candidate card, compared with the mandatory rubric, and scored or logged with missing evidence.',
    },
    {
        index: '03',
        label: 'A deterministic outcome',
        title: 'An interview or a concrete next step.',
        icon: Route,
        chart: `
flowchart TD
    A[Audit complete] --> B(Eligible?)
    B -->|Yes| C[Interview slots unlocked]
    C --> D[Applicant confirms]
    D --> E[Calendar locked]
    B -->|No| F[Gap roadmap]
    F --> G[Re-apply with new proof]
    classDef accent fill:{{accent}},stroke:{{accent}},color:#ffffff;
    classDef soft fill:{{accentSoft}},stroke:{{accent}},color:{{accentText}};
    class C,D,E accent;
    class F,G,H soft;
`,
        diagramLabel:
            'Flowchart of the outcome: eligible applicants unlock and confirm interview slots, while redirected applicants receive a gap roadmap and can re-apply with new proof.',
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
                                        <div className='mt-4 rounded-xl border border-(--border-line) bg-(--bg-panel) p-4 sm:p-5'>
                                            <MermaidDiagram
                                                chart={step.chart}
                                                label={step.diagramLabel}
                                            />
                                        </div>
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
            <Footer />
        </div>
    );
}
