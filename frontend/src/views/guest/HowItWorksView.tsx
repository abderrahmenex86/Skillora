import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ChapterHeader, SiteFooter } from '../../components/Brand';

const STEPS = [
    {
        tag: 'Tailored resumes',
        title: 'Apply with tailored resumes',
        text: 'Applicants set up dedicated resumes (e.g. Data Engineer, Penetration Tester, or Corporate Counsel) with role-specific summaries, selected projects, GitHub repos, and credentials. Each application evaluated reflects the exact resume you choose.',
    },
    {
        tag: 'Autonomous rubrics',
        title: 'Evidence match across all disciplines',
        text: 'Companies specify mandatory criteria. The agent normalizes submissions into randomized candidate cards (e.g. #DZ-308), auditing artifacts and degree credentials objectively.',
    },
    {
        tag: 'Logistics or growth',
        title: 'Guaranteed interview or learning path',
        text: 'Eligible applicants receive automated calendar slots to confirm directly on their dashboard calendar. Redirected applicants receive a gap analysis detailing exact steps to qualify next time.',
    },
];

export default function HowItWorksView() {
    return (
        <div className='flex flex-1 flex-col'>
            <main className='w-full'>
                <ChapterHeader
                    eyebrow='How it works'
                    number='Three steps'
                    title='From application to'
                    accent='answer.'>
                    Skillora replaces keyword filtering with verified evidence
                    and guarantees a dual outcome: an interview invitation or
                    an actionable gap roadmap.
                </ChapterHeader>

                <section className='mx-auto w-full max-w-6xl px-6'>
                    <ol>
                        {STEPS.map((step, index) => (
                            <li
                                key={step.title}
                                className='group grid grid-cols-1 gap-6 border-b border-(--border-line) py-14 md:grid-cols-12'>
                                <div className='md:col-span-3'>
                                    <span className='display text-8xl text-(--text-main) transition-all duration-500 group-hover:italic'>
                                        0{index + 1}
                                    </span>
                                </div>
                                <div className='md:col-span-8 md:col-start-5'>
                                    <span className='kicker'>{step.tag}</span>
                                    <h3 className='display mt-3 text-4xl text-(--text-main) md:text-5xl'>
                                        {step.title}
                                    </h3>
                                    <p className='mt-4 max-w-xl font-light leading-relaxed text-(--text-sub)'>
                                        {step.text}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>

                    <div className='flex justify-center py-24'>
                        <Link
                            to='/auth?mode=register'
                            className='btn-primary'>
                            Build your resume
                            <ArrowRight
                                size={14}
                                strokeWidth={1.5}
                            />
                        </Link>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
