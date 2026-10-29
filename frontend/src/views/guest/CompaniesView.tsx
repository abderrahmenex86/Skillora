import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Terminal, Users } from 'lucide-react';
import Footer from '../../components/Footer';
import CompanyMark from '../../components/CompanyMark';
import { ALGERIAN_COMPANIES } from '../../data/algerianCompanies';

export default function CompaniesView() {
    return (
        <div className='page-scroll flex flex-col'>
            <main className='max-w-6xl mx-auto px-6 pt-6 pb-2 tall:py-16 w-full'>
                <h1 className='font-grotesque font-extrabold text-5xl sm:text-6xl text-(--text-main) tracking-tight mb-4'>
                    Stop screening hundreds of unvetted CVs per opening.
                </h1>
                <p className='text-lg text-(--text-sub) max-w-2xl leading-relaxed mb-8 tall:mb-16'>
                    Engineering managers and HR leads lose dozens of hours every
                    week reading inflated resumes. Skillora delivers verified
                    candidate dossiers where claimed competencies are backed by
                    qualifications.
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
                            Post-deadline seat extension
                        </h4>
                        <p className='text-xs text-(--text-sub) leading-relaxed'>
                            Recruiters can add a final-round seat, keep a
                            candidate on hold, or reject after the deadline —
                            the pipeline does not hard-stop at close.
                        </p>
                    </div>

                    <div className='p-5 tall:p-6 border border-(--border-line) rounded-lg bg-(--bg-canvas)'>
                        <Users
                            size={22}
                            className='text-(--text-main) mb-3 tall:mb-4'
                        />
                        <h4 className='font-grotesque font-bold text-2xl text-(--text-main) mb-2'>
                            Guaranteed feedback
                        </h4>
                        <p className='text-xs text-(--text-sub) leading-relaxed'>
                            Every applicant gets a decision. Rejected
                            candidates receive the missing criteria and a
                            concrete next step instead of silence.
                        </p>
                    </div>
                </div>

                <section className='mt-12 border-t border-(--border-line) pt-10'>
                    <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
                        <div className='max-w-2xl'>
                            <p className='font-mono text-[10px] uppercase tracking-[0.22em] text-(--text-sub)'>
                                Hiring network
                            </p>
                            <h2 className='mt-2 font-grotesque text-3xl font-extrabold tracking-tight text-(--text-main) sm:text-4xl'>
                                {ALGERIAN_COMPANIES.length} companies across
                                Algeria, in one network.
                            </h2>
                            <p className='mt-3 text-sm leading-relaxed text-(--text-sub)'>
                                From banking and telecom to energy, retail, and
                                engineering — the same directory applicants
                                search on the homepage.
                            </p>
                        </div>
                        <span className='inline-flex shrink-0 items-center gap-2 rounded-full border border-forest/25 bg-forest/8 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-forest dark:border-forest-dark/30 dark:bg-forest-dark/10 dark:text-forest-dark'>
                            <span className='h-1.5 w-1.5 rounded-full bg-forest dark:bg-forest-dark' />
                            Live directory
                        </span>
                    </div>

                    <div className='mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                        {ALGERIAN_COMPANIES.map((company) => (
                            <article
                                key={company.name}
                                className='group flex items-center gap-3 rounded-lg border border-(--border-line) bg-(--bg-canvas) p-3.5 transition-colors hover:border-(--text-sub)/40 hover:bg-(--bg-panel)'>
                                <CompanyMark company={company} />
                                <div className='min-w-0'>
                                    <h3
                                        className='line-clamp-2 text-sm font-semibold leading-snug text-(--text-main)'
                                        title={company.name}>
                                        {company.name}
                                    </h3>
                                    <p className='truncate font-mono text-[9px] uppercase leading-snug tracking-[0.1em] text-(--text-sub)'>
                                        {company.sector}
                                    </p>
                                    <p className='truncate font-mono text-[9px] uppercase leading-snug tracking-[0.1em] text-(--text-sub)'>
                                        {company.city}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <div className='mt-12 border border-(--border-line) p-6 tall:p-8 rounded-lg bg-(--bg-panel) flex flex-col md:flex-row items-center justify-between gap-6'>
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
            <Footer />
        </div>
    );
}
