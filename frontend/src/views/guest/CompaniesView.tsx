import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Terminal, Users } from 'lucide-react';

export default function CompaniesView() {
    return (
        <div className='flex-1 flex flex-col justify-between'>
            <main className='max-w-6xl mx-auto px-6 pt-6 pb-2 tall:py-16 w-full'>
                <h1 className='font-grotesque font-extrabold text-5xl sm:text-6xl text-(--text-main) tracking-tight mb-4'>
                    Stop screening 500 unvetted CVs per opening.
                </h1>
                <p className='text-lg text-(--text-sub) max-w-2xl leading-relaxed mb-8 tall:mb-16'>
                    Engineering managers and HR leads lose dozens of hours every
                    week reading inflated resumes. Skillora delivers verified
                    candidate dossiers where claimed competencies are backed by
                    evidence.
                </p>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 tall:mb-16'>
                    <div className='p-5 tall:p-6 border border-(--border-line) rounded-lg bg-(--bg-canvas)'>
                        <Terminal
                            size={22}
                            className='text-(--text-main) mb-3 tall:mb-4'
                        />
                        <h4 className='font-grotesque font-bold text-2xl text-(--text-main) mb-2'>
                            Verifiable Rubrics
                        </h4>
                        <p className='text-xs text-(--text-sub) leading-relaxed'>
                            Specify mandatory proofs: public commits, Docker
                            configurations, Go/Python APIs, bar credentials, or
                            university diplomas.
                        </p>
                    </div>

                    <div className='p-5 tall:p-6 border border-(--border-line) rounded-lg bg-(--bg-canvas)'>
                        <ShieldCheck
                            size={22}
                            className='text-(--text-main) mb-3 tall:mb-4'
                        />
                        <h4 className='font-grotesque font-bold text-2xl text-(--text-main) mb-2'>
                            Pre-Deadline Override
                        </h4>
                        <p className='text-xs text-(--text-sub) leading-relaxed'>
                            Recruiters retain full authority: manually promote
                            or decline candidate decisions at any time prior to
                            the position closing deadline.
                        </p>
                    </div>

                    <div className='p-5 tall:p-6 border border-(--border-line) rounded-lg bg-(--bg-canvas)'>
                        <Users
                            size={22}
                            className='text-(--text-main) mb-3 tall:mb-4'
                        />
                        <h4 className='font-grotesque font-bold text-2xl text-(--text-main) mb-2'>
                            Zero-Ghosting Brand Protection
                        </h4>
                        <p className='text-xs text-(--text-sub) leading-relaxed'>
                            Preserve your employer reputation. Applicants not
                            selected receive courteous, actionable learning
                            roadmaps instead of silence.
                        </p>
                    </div>
                </div>

                <div className='border border-(--border-line) p-6 tall:p-8 rounded-lg bg-(--bg-panel) flex flex-col md:flex-row items-center justify-between gap-6'>
                    <div>
                        <h3 className='font-grotesque font-bold text-3xl text-(--text-main) mb-1'>
                            Ready to deploy your candidate cohort?
                        </h3>
                        <p className='text-xs text-(--text-sub)'>
                            First job opening completely free. Automated
                            calendar coordination included.
                        </p>
                    </div>
                    <Link
                        to='/auth?mode=register'
                        className='px-6 py-3 bg-(--btn-main-bg) text-(--btn-main-text) font-grotesque font-bold text-xl rounded-md hover:opacity-90 transition-opacity inline-flex items-center gap-2'>
                        Open Recruiter Account <ArrowRight size={18} />
                    </Link>
                </div>
            </main>

            <footer className='border-t border-(--border-line) py-3 tall:py-6 px-6 text-xs font-mono text-(--text-sub) max-w-7xl mx-auto w-full text-center'>
                Skillora Infrastructure • Used by teams across Algiers, Oran,
                and Constantine
            </footer>
        </div>
    );
}
