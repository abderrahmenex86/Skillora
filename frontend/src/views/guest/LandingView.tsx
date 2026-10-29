import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Masthead, SiteFooter } from '../../components/Brand';
import { useAuthStore } from '../../store/useAuthStore';

const CHAPTERS = [
    {
        n: 'I',
        title: 'Apply with evidence',
        text: 'Tailored resumes built from real projects, repositories and verified degrees — not keywords.',
    },
    {
        n: 'II',
        title: 'Read against a rubric',
        text: 'Every application is weighed against the criteria the employer actually needs, the same way, every time.',
    },
    {
        n: 'III',
        title: 'Always an answer',
        text: 'An interview slot on your calendar, or a clear roadmap to qualify next time. Never silence.',
    },
];

export default function LandingView() {
    const user = useAuthStore((state) => state.user);

    const primaryTo =
        user?.role === 'RECRUITER' ? '/recruiter/positions'
        : user?.role === 'APPLICANT' ? '/jobs'
        : '/auth?mode=register';
    const primaryLabel =
        user?.role === 'RECRUITER' ? 'Recruiter workspace'
        : user?.role === 'APPLICANT' ? 'Explore positions'
        : 'Get started';

    return (
        <div className='flex flex-1 flex-col'>
            <main className='mx-auto w-full max-w-6xl px-6 pt-10'>
                <Masthead
                    left='Vol. 01 — Algiers'
                    right='Multi-agent recruiting'
                />

                {/* Cover */}
                <section className='grid grid-cols-1 items-end gap-16 pb-24 pt-14 md:grid-cols-12 md:pt-20'>
                    <div className='animate-fade-up md:col-span-7'>
                        <h1 className='display text-[3.9rem] text-(--text-main) sm:text-8xl lg:text-[8.5rem]'>
                            Hiring shouldn’t end in{' '}
                            <em className='italic'>silence.</em>
                        </h1>
                        <p className='lead mt-8 max-w-md'>
                            Skillora matches talent on real evidence. Every
                            applicant receives an interview, or a path to grow.
                        </p>
                        <div className='mt-10 flex flex-wrap items-center gap-3'>
                            <Link
                                to={primaryTo}
                                className='btn-primary'>
                                {primaryLabel}
                                <ArrowRight
                                    size={14}
                                    strokeWidth={1.5}
                                />
                            </Link>
                            <Link
                                to={user ? '/jobs' : '/how-it-works'}
                                className='btn-secondary'>
                                {user ? 'Open roles' : 'How it works'}
                            </Link>
                        </div>
                    </div>

                    {/* The dossier — a printed page under soft light */}
                    <div className='relative md:col-span-5'>
                        <div
                            aria-hidden='true'
                            className='glow'
                        />
                        <article className='animate-fade-up rotate-[1.2deg] border border-(--border-line) bg-(--bg-elevated) p-8 shadow-[0_40px_80px_-40px_rgb(17_17_16/0.35)] transition-transform duration-700 [animation-delay:200ms] hover:rotate-0 sm:p-10'>
                            <div className='kicker flex justify-between'>
                                <span>Dossier</span>
                                <span>№ DZ-308</span>
                            </div>
                            <div className='hairline-ink mt-3' />
                            <p className='display mt-10 text-[5.5rem] leading-none text-(--text-main)'>
                                94<span className='text-5xl'>%</span>
                            </p>
                            <p className='mt-2 font-serif text-2xl italic text-(--text-main)'>
                                Evidence match
                            </p>
                            <div className='hairline mt-8' />
                            <dl className='mt-5 space-y-3 text-sm font-light text-(--text-sub)'>
                                <div className='flex justify-between gap-6'>
                                    <dt>Repositories</dt>
                                    <dd className='text-(--text-main)'>
                                        3 verified CI/CD
                                    </dd>
                                </div>
                                <div className='flex justify-between gap-6'>
                                    <dt>Degree</dt>
                                    <dd className='text-right text-(--text-main)'>
                                        Ingénieur d'État, ESI
                                    </dd>
                                </div>
                                <div className='flex justify-between gap-6'>
                                    <dt>Outcome</dt>
                                    <dd className='text-(--text-main)'>
                                        Interview
                                    </dd>
                                </div>
                            </dl>
                        </article>
                    </div>
                </section>

                {/* Three chapters */}
                <section>
                    <div className='hairline-ink' />
                    <div className='grid grid-cols-1 md:grid-cols-3'>
                        {CHAPTERS.map((chapter, index) => (
                            <div
                                key={chapter.n}
                                className={`group py-12 md:px-8 ${index === 0 ? 'md:pl-0' : 'md:border-l md:border-(--border-line)'} ${index === 2 ? 'md:pr-0' : ''}`}>
                                <span className='font-serif text-xl italic text-(--text-sub)'>
                                    {chapter.n}.
                                </span>
                                <h3 className='display mt-6 text-4xl text-(--text-main) transition-transform duration-500 group-hover:translate-x-1'>
                                    {chapter.title}
                                </h3>
                                <p className='mt-4 text-[0.95rem] font-light leading-relaxed text-(--text-sub)'>
                                    {chapter.text}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className='hairline' />
                </section>

                {/* Pull quote */}
                <section className='relative py-28 text-center md:py-36'>
                    <div
                        aria-hidden='true'
                        className='glow inset-x-[15%]! inset-y-0!'
                    />
                    <span className='kicker'>The promise</span>
                    <blockquote className='display mx-auto mt-8 max-w-4xl text-5xl text-(--text-main) md:text-7xl'>
                        “Every applicant gets an interview,{' '}
                        <em className='italic'>or a path to grow.</em>”
                    </blockquote>
                </section>

                {/* Two readers */}
                <section className='grid grid-cols-1 border-y border-(--text-main) md:grid-cols-2'>
                    <div className='py-14 md:border-r md:border-(--border-line) md:pr-12'>
                        <span className='kicker'>For employers</span>
                        <h3 className='display mt-5 text-5xl text-(--text-main)'>
                            A shortlist you can <em className='italic'>trust.</em>
                        </h3>
                        <p className='mt-5 max-w-sm font-light leading-relaxed text-(--text-sub)'>
                            Pre-vetted candidate dossiers where every claim is
                            backed by evidence. Scheduling handled for you.
                        </p>
                        <Link
                            to='/companies'
                            className='link-underline mt-8 inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-(--text-main)'>
                            For companies
                            <ArrowRight
                                size={13}
                                strokeWidth={1.5}
                            />
                        </Link>
                    </div>
                    <div className='border-t border-(--border-line) py-14 md:border-t-0 md:pl-12'>
                        <span className='kicker'>For applicants</span>
                        <h3 className='display mt-5 text-5xl text-(--text-main)'>
                            Feedback, <em className='italic'>not silence.</em>
                        </h3>
                        <p className='mt-5 max-w-sm font-light leading-relaxed text-(--text-sub)'>
                            “Missing Kubernetes orchestration — deploy a Helm
                            microservice and re-apply.” Specific, respectful,
                            useful.
                        </p>
                        <Link
                            to={
                                user?.role === 'APPLICANT' ?
                                    '/applicant/dashboard'
                                :   '/how-it-works'
                            }
                            className='link-underline mt-8 inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-(--text-main)'>
                            {user?.role === 'APPLICANT' ?
                                'Your feedback'
                            :   'How it works'}
                            <ArrowRight
                                size={13}
                                strokeWidth={1.5}
                            />
                        </Link>
                    </div>
                </section>

                {/* Closing */}
                {!user && (
                    <section className='py-28 text-center md:py-36'>
                        <h2 className='display mx-auto max-w-3xl text-6xl text-(--text-main) md:text-8xl'>
                            Never ghost <em className='italic'>a candidate.</em>
                        </h2>
                        <div className='mt-12 flex flex-wrap justify-center gap-3'>
                            <Link
                                to='/auth?mode=register'
                                className='btn-primary'>
                                Create a free account
                                <ArrowRight
                                    size={14}
                                    strokeWidth={1.5}
                                />
                            </Link>
                            <Link
                                to='/pricing'
                                className='btn-secondary'>
                                See pricing
                            </Link>
                        </div>
                    </section>
                )}
                {user && <div className='pb-24' />}
            </main>

            <SiteFooter />
        </div>
    );
}
