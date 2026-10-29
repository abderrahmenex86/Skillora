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
import MermaidDiagram from '../../components/MermaidDiagram';

const APPLICANT_FLOW = `
flowchart TD
    A[Create a tailored resume] --> B[Apply to a role]
    B --> C[Skillora audits the evidence]
    C --> D{Meets the rubric?}
    D -->|Yes| E[Interview slots unlocked]
    D -->|No| F[Actionable gap roadmap]
    E --> G[Confirm on your calendar]
    F --> H[Close the gap and re-apply]
    H --> B
    classDef accent fill:{{accent}},stroke:{{accent}},color:#ffffff;
    classDef soft fill:{{accentSoft}},stroke:{{accent}},color:{{accentText}};
    class E,G accent;
    class F,H soft;
`;

const RECRUITER_FLOW = `
flowchart TD
    R[Define the role and rubric] --> P[Publish the position]
    P --> A[Applications arrive]
    A --> N[Normalize candidate cards]
    N --> E[Audit artifacts and credentials]
    E --> S[Ranked shortlist]
    S --> I[Interview scheduled]
    S --> G[Actionable feedback sent]
    I --> H[Hire with proof]
    classDef accent fill:{{accent}},stroke:{{accent}},color:#ffffff;
    classDef soft fill:{{accentSoft}},stroke:{{accent}},color:{{accentText}};
    class E,S accent;
    class G soft;
`;

const SYSTEM_SEQUENCE = `
sequenceDiagram
    autonumber
    actor A as Applicant
    participant S as Skillora
    actor R as Recruiter
    R->>S: Publish role + mandatory rubric
    A->>S: Submit tailored resume
    S->>S: Audit artifacts and credentials
    alt Evidence verified
        S->>A: Interview slots
        S->>R: Ranked shortlist
        A->>S: Confirm slot
        S->>R: Calendar locked
    else Gap identified
        S->>A: Actionable growth roadmap
        A->>S: Re-apply with new proof
    end
`;

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

function DiagramCard({
    eyebrow,
    title,
    description,
    chart,
    label,
    className = '',
    wide = false,
}: {
    eyebrow: string;
    title: string;
    description: string;
    chart: string;
    label: string;
    className?: string;
    wide?: boolean;
}) {
    return (
        <article
            className={`rounded-xl border border-(--border-line) bg-(--bg-canvas) p-5 ${className}`}>
            <div className='flex items-start justify-between gap-3 border-b border-(--border-line) pb-4'>
                <div>
                    <p className='font-mono text-[10px] uppercase tracking-[0.18em] text-(--text-sub)'>
                        {eyebrow}
                    </p>
                    <h3 className='mt-1 font-grotesque text-2xl font-bold text-(--text-main)'>
                        {title}
                    </h3>
                </div>
                <span className='mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-forest/25 bg-forest/8 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-forest dark:border-forest-dark/30 dark:bg-forest-dark/10 dark:text-forest-dark'>
                    <span className='h-1.5 w-1.5 rounded-full bg-forest dark:bg-forest-dark' />
                    Mermaid
                </span>
            </div>
            <p className='mt-3 text-sm leading-relaxed text-(--text-sub)'>
                {description}
            </p>
            {wide && (
                <p className='mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub) sm:hidden'>
                    Swipe the diagram sideways
                    <ArrowRight
                        size={11}
                        aria-hidden='true'
                    />
                </p>
            )}
            <div className='mt-4 rounded-lg border border-(--border-line) bg-(--bg-panel) p-3 sm:p-4'>
                <MermaidDiagram
                    chart={chart}
                    label={label}
                    wide={wide}
                />
            </div>
        </article>
    );
}

export default function HowItWorksView() {
    return (
        <div className='page-scroll flex flex-col'>
            <main className='mx-auto w-full max-w-6xl px-6 py-16'>
                <header className='grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12'>
                    <div className='lg:col-span-7'>
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
                    </div>

                    <div className='lg:col-span-5'>
                        <figure className='overflow-hidden rounded-xl border border-(--border-line) bg-(--bg-panel)'>
                            <img
                                src='/images/how-it-works-hero.webp'
                                alt='A candidate in a suit reviewing a printed document before applying'
                                className='aspect-[4/5] w-full object-cover'
                                loading='eager'
                            />
                            <figcaption className='flex items-center justify-between gap-3 border-t border-(--border-line) px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                <span>Evidence over adjectives</span>
                                <span>01 / 03</span>
                            </figcaption>
                        </figure>
                    </div>
                </header>

                <section className='mt-16 border-t border-(--border-line) pt-12'>
                    <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
                        <div className='max-w-2xl'>
                            <p className='font-mono text-[10px] uppercase tracking-[0.22em] text-(--text-sub)'>
                                Process map
                            </p>
                            <h2 className='mt-3 font-grotesque text-4xl font-extrabold leading-none tracking-tight text-(--text-main) sm:text-5xl'>
                                One loop. Two sides. No silence.
                            </h2>
                        </div>
                        <p className='max-w-sm text-sm leading-relaxed text-(--text-sub)'>
                            The applicant and recruiter journeys share the same
                            evidence layer. Follow the branches to see exactly
                            where a submission can go.
                        </p>
                    </div>

                    <div className='mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2'>
                        <DiagramCard
                            eyebrow='Applicant journey'
                            title='Apply once. Grow every time.'
                            description='Every submission ends in an interview path or a specific plan to close the gap.'
                            chart={APPLICANT_FLOW}
                            label='Flowchart of the applicant journey: a tailored resume leads to an evidence audit, then either an interview slot or a gap roadmap that loops back to re-applying.'
                        />
                        <DiagramCard
                            eyebrow='Recruiter pipeline'
                            title='Shortlists with proof attached.'
                            description='The rubric stays visible from the first application to the signed offer.'
                            chart={RECRUITER_FLOW}
                            label='Flowchart of the recruiter pipeline: define a rubric, publish the role, normalize candidate cards, audit evidence, shortlist, schedule interviews, and send actionable feedback.'
                        />
                    </div>

                    <div className='mt-6'>
                        <DiagramCard
                            eyebrow='System sequence'
                            title='Who does what, and when.'
                            description='A single audit step connects the applicant and recruiter views, so both sides see the same decision and the same next action.'
                            chart={SYSTEM_SEQUENCE}
                            label='Sequence diagram showing the applicant, Skillora, and recruiter exchanging a resume, rubric, evidence audit, interview slots, shortlist, and gap feedback.'
                            wide
                        />
                    </div>
                </section>

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
