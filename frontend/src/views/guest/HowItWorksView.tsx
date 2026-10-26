import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function HowItWorksView() {
    return (
        <div className='flex-1 flex flex-col justify-between'>
            <main className='max-w-5xl mx-auto px-6 py-16 w-full'>
                <h1 className='font-grotesque font-extrabold text-5xl sm:text-6xl text-(--text-main) tracking-tight mb-6 leading-none'>
                    How Skillora Works
                </h1>
                <p className='text-lg text-(--text-sub) max-w-2xl leading-relaxed mb-16'>
                    Skillora replaces keyword filtering with verified evidence
                    and guarantees a deterministic dual outcome: an interview
                    invitation or an actionable gap roadmap.
                </p>

                <div className='space-y-12 border-t border-(--border-line) pt-12 mb-16'>
                    <div className='grid grid-cols-1 md:grid-cols-12 gap-6 items-start'>
                        <div className='md:col-span-3 font-mono text-sm text-(--text-sub)'>
                            01 / TAILORED RESUMES
                        </div>
                        <div className='md:col-span-9'>
                            <h3 className='font-grotesque font-bold text-3xl text-(--text-main) mb-2'>
                                Apply with tailored resumes
                            </h3>
                            <p className='text-sm text-(--text-sub) leading-relaxed'>
                                Applicants set up dedicated resumes (e.g. Data
                                Engineer, Penetration Tester, or Corporate
                                Counsel) with role-specific summaries, selected
                                projects, GitHub repos, and credentials. Each
                                application evaluated reflects the exact resume
                                you choose.
                            </p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-12 gap-6 items-start border-t border-(--border-line) pt-8'>
                        <div className='md:col-span-3 font-mono text-sm text-(--text-sub)'>
                            02 / AUTONOMOUS RUBRICS
                        </div>
                        <div className='md:col-span-9'>
                            <h3 className='font-grotesque font-bold text-3xl text-(--text-main) mb-2'>
                                Evidence match across all disciplines
                            </h3>
                            <p className='text-sm text-(--text-sub) leading-relaxed'>
                                Companies specify mandatory criteria. The agent
                                normalizes submissions into randomized candidate
                                cards (e.g. `#DZ-308`), auditing artifacts and
                                degree credentials objectively.
                            </p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-12 gap-6 items-start border-t border-(--border-line) pt-8'>
                        <div className='md:col-span-3 font-mono text-sm text-amber-accent'>
                            03 / LOGISTICS OR GROWTH
                        </div>
                        <div className='md:col-span-9'>
                            <h3 className='font-grotesque font-bold text-3xl text-(--text-main) mb-2'>
                                Guaranteed interview or learning path
                            </h3>
                            <p className='text-sm text-(--text-sub) leading-relaxed mb-4'>
                                Eligible applicants receive automated calendar
                                slots to confirm directly on their dashboard
                                calendar. Redirected applicants receive the
                                Cedar Amber gap analysis detailing exact steps
                                to qualify next time.
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <Link
                        to='/auth?mode=register'
                        className='px-6 py-3.5 bg-(--btn-main-bg) text-(--btn-main-text) font-grotesque font-bold text-xl rounded-md hover:opacity-90 transition-opacity inline-flex items-center gap-2'>
                        Build Your Resume <ArrowRight size={18} />
                    </Link>
                </div>
            </main>

            <footer className='border-t border-(--border-line) py-6 px-6 text-xs font-mono text-(--text-sub) max-w-7xl mx-auto w-full text-center'>
                Skillora Architecture • Deterministic Talent Evaluation
            </footer>
        </div>
    );
}
