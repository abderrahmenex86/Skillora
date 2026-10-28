import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, FileText, ScanSearch } from 'lucide-react';
import {
    ChapterHeader,
    PipelineFlow,
    SiteFooter,
} from '../../components/Brand';

const STEPS = [
    {
        icon: FileText,
        tag: 'Step 01 · Tailored resumes',
        title: 'Apply with tailored resumes',
        text: 'Applicants set up dedicated resumes (e.g. Data Engineer, Penetration Tester, or Corporate Counsel) with role-specific summaries, selected projects, GitHub repos, and credentials. Each application evaluated reflects the exact resume you choose.',
    },
    {
        icon: ScanSearch,
        tag: 'Step 02 · Autonomous rubrics',
        title: 'Evidence match across all disciplines',
        text: 'Companies specify mandatory criteria. The agent normalizes submissions into randomized candidate cards (e.g. #DZ-308), auditing artifacts and degree credentials objectively.',
    },
    {
        icon: CalendarCheck,
        tag: 'Step 03 · Logistics or growth',
        title: 'Guaranteed interview or learning path',
        text: 'Eligible applicants receive automated calendar slots to confirm directly on their dashboard calendar. Redirected applicants receive the Cedar Amber gap analysis detailing exact steps to qualify next time.',
        amber: true,
    },
];

export default function HowItWorksView() {
    return (
        <div className='flex flex-1 flex-col'>
            <main className='w-full'>
                <ChapterHeader
                    eyebrow='How it works'
                    title='From PDF to interview,'
                    accent='on autopilot.'>
                    Skillora replaces keyword filtering with verified evidence
                    and guarantees a deterministic dual outcome:{' '}
                    <span className='text-white'>
                        an interview invitation or an actionable gap roadmap.
                    </span>
                </ChapterHeader>

                <section className='mx-auto w-full max-w-7xl px-6 pt-20'>
                    <span className='eyebrow'>Three steps</span>
                    <h2 className='display mt-2 text-5xl text-(--text-main) md:text-7xl'>
                        One application.{' '}
                        <span className='text-accent'>One clear outcome.</span>
                    </h2>

                    <div className='mt-10 grid grid-cols-1 gap-5 md:grid-cols-3'>
                        {STEPS.map((step, index) => (
                            <div
                                key={step.title}
                                className={`card-hover p-8 ${index === 0 ? 'card-dark' : 'card'}`}>
                                <span
                                    className={`icon-tile ${step.amber ? 'icon-tile-amber' : ''}`}>
                                    <step.icon size={20} />
                                </span>
                                <div
                                    className={`eyebrow mt-6 ${step.amber ? 'eyebrow-amber' : ''}`}>
                                    {step.tag}
                                </div>
                                <h3 className='display mt-2 text-4xl text-(--text-main)'>
                                    {step.title}
                                </h3>
                                <p className='mt-3 text-sm leading-relaxed text-(--text-sub)'>
                                    {step.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className='mx-auto w-full max-w-7xl px-4 pt-20 sm:px-6'>
                    <div className='panel-dark rounded-3xl px-7 py-14 sm:px-12'>
                        <span className='eyebrow'>Under the hood</span>
                        <h2 className='display mb-12 mt-2 text-5xl text-white'>
                            The multi-agent pipeline
                        </h2>
                        <PipelineFlow />
                    </div>
                </section>

                <div className='flex justify-center py-20'>
                    <Link
                        to='/auth?mode=register'
                        className='btn-primary px-6! py-3.5! text-base!'>
                        Build Your Resume <ArrowRight size={18} />
                    </Link>
                </div>
            </main>

            <SiteFooter tagline='Deterministic talent evaluation' />
        </div>
    );
}
