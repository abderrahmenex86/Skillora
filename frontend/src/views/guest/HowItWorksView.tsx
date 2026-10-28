import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, FileText, ScanSearch } from 'lucide-react';
import { SiteFooter } from '../../components/Brand';

const STEPS = [
    {
        icon: FileText,
        tag: 'Tailored resumes',
        title: 'Apply with tailored resumes',
        text: 'Applicants set up dedicated resumes (e.g. Data Engineer, Penetration Tester, or Corporate Counsel) with role-specific summaries, selected projects, GitHub repos, and credentials. Each application evaluated reflects the exact resume you choose.',
        accent: false,
    },
    {
        icon: ScanSearch,
        tag: 'Autonomous rubrics',
        title: 'Evidence match across all disciplines',
        text: 'Companies specify mandatory criteria. The agent normalizes submissions into randomized candidate cards (e.g. #DZ-308), auditing artifacts and degree credentials objectively.',
        accent: false,
    },
    {
        icon: CalendarCheck,
        tag: 'Logistics or growth',
        title: 'Guaranteed interview or learning path',
        text: 'Eligible applicants receive automated calendar slots to confirm directly on their dashboard calendar. Redirected applicants receive the Cedar Amber gap analysis detailing exact steps to qualify next time.',
        accent: true,
    },
];

export default function HowItWorksView() {
    return (
        <div className='flex flex-1 flex-col'>
            <main className='mx-auto w-full max-w-5xl px-6 py-16 md:py-20'>
                <div className='animate-fade-up mx-auto max-w-3xl text-center'>
                    <span className='eyebrow mb-5'>How it works</span>
                    <h1 className='font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-(--text-main) sm:text-6xl'>
                        From application to{' '}
                        <span className='text-gradient'>outcome</span>, in
                        three steps
                    </h1>
                    <p className='mt-6 text-lg leading-relaxed text-(--text-sub)'>
                        Skillora replaces keyword filtering with verified
                        evidence and guarantees a deterministic dual outcome:
                        an interview invitation or an actionable gap roadmap.
                    </p>
                </div>

                <ol className='relative mt-16 space-y-6 before:absolute before:bottom-8 before:left-[1.85rem] before:top-8 before:hidden before:w-px before:bg-linear-to-b before:from-brand-500 before:via-violet-accent before:to-amber-accent md:before:block'>
                    {STEPS.map((step, index) => (
                        <li
                            key={step.title}
                            className='relative flex flex-col gap-5 md:flex-row md:items-start'>
                            <span
                                className={`relative z-10 inline-flex h-15 w-15 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${
                                    step.accent ?
                                        'bg-linear-to-br from-amber-accent to-pink-accent'
                                    :   'bg-linear-to-br from-brand-500 to-violet-accent'
                                }`}>
                                <step.icon size={24} />
                            </span>
                            <div className='card card-hover flex-1 p-7'>
                                <div
                                    className={`mb-2 text-xs font-semibold uppercase tracking-wider ${
                                        step.accent ?
                                            'text-amber-accent'
                                        :   'text-brand-600 dark:text-brand-300'
                                    }`}>
                                    Step 0{index + 1} · {step.tag}
                                </div>
                                <h3 className='font-display text-2xl font-bold text-(--text-main)'>
                                    {step.title}
                                </h3>
                                <p className='mt-3 text-sm leading-relaxed text-(--text-sub)'>
                                    {step.text}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>

                <div className='mt-14 flex justify-center'>
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
