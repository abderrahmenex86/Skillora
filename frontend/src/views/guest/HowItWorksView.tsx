import { Link } from 'react-router-dom';
import {
    ArrowRight,
    ArrowUpRight,
    CalendarCheck2,
    Route,
    ShieldCheck,
} from 'lucide-react';
import Footer from '../../components/Footer';
import MermaidDiagram from '../../components/MermaidDiagram';

const PROCESS_FLOW_DESKTOP = `
flowchart LR
    subgraph P1["01 · Resume"]
        direction TB
        A[Choose role] --> B[Select evidence]
        B --> C[Generate resume]
    end
    subgraph P2["02 · Audit"]
        direction TB
        D[Submit application] --> E[Parse + normalize]
        E --> F[Audit rubric]
        F --> G{Verified?}
    end
    subgraph P3["03 · Outcome"]
        direction TB
        H[Interview + calendar]
        J[Gap roadmap + re-apply]
    end
    C --> D
    G -->|Yes| H
    G -->|No| J
    classDef accent fill:{{accent}},stroke:{{accent}},color:{{onAccent}};
    classDef soft fill:{{accentSoft}},stroke:{{muted}},color:{{accentText}};
    class D,H accent;
    class G,J soft;
`;

const PROCESS_FLOW_MOBILE = `
flowchart TD
    A[Choose a role] --> B[Select evidence]
    B --> C[Generate resume]
    C --> D{Ready to submit?}
    D -->|No| E[Add missing proof]
    E --> B
    D -->|Yes| F[Submit application]
    F --> G[Parse + normalize]
    G --> H[Audit against rubric]
    H --> I{Evidence verified?}
    I -->|Yes| J[Unlock interview slots]
    J --> K[Calendar locked]
    I -->|No| L[Gap roadmap]
    L --> M[Re-apply with new proof]
    classDef accent fill:{{accent}},stroke:{{accent}},color:{{onAccent}};
    classDef soft fill:{{accentSoft}},stroke:{{muted}},color:{{accentText}};
    class F,J,K accent;
    class D,E,I,L,M soft;
`;

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
                            The full flow
                        </p>
                        <h2 className='mt-3 font-grotesque text-4xl font-extrabold leading-none tracking-tight text-(--text-main) sm:text-5xl'>
                            What happens under the hood.
                        </h2>
                    </div>

                    <div className='mt-10 max-w-6xl rounded-xl border border-(--border-line) bg-(--bg-panel) p-4 sm:p-6'>
                        <MermaidDiagram
                            chart={PROCESS_FLOW_DESKTOP}
                            mobileChart={PROCESS_FLOW_MOBILE}
                            label='End-to-end flowchart: tailor a resume, submit it for an evidence audit, then route to interview scheduling or an actionable gap roadmap.'
                        />
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
