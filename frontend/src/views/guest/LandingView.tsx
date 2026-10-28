import { Link } from 'react-router-dom';
import {
    ArrowRight,
    BadgeCheck,
    CalendarCheck,
    FileText,
    GitBranch,
    GraduationCap,
    Sparkles,
    Target,
    TrendingUp,
} from 'lucide-react';
import { MatchPathSketch } from '../../components/Sketches';
import { SiteFooter } from '../../components/Brand';
import { useAuthStore } from '../../store/useAuthStore';

const STATS = [
    { value: '100%', label: 'Applicants get a response' },
    { value: '58', label: 'Wilayas covered' },
    { value: '3', label: 'Languages parsed (FR/EN/AR)' },
    { value: '1st', label: 'Job opening free for employers' },
];

const STEPS = [
    {
        icon: FileText,
        title: 'Tailored resumes',
        text: 'Build role-specific resumes with projects, repos and verified credentials.',
    },
    {
        icon: Target,
        title: 'Evidence rubrics',
        text: 'Every application is audited against the criteria the employer actually needs.',
    },
    {
        icon: CalendarCheck,
        title: 'Interview or growth',
        text: 'Get an interview slot instantly, or a concrete roadmap to qualify next time.',
    },
];

export default function LandingView() {
    const user = useAuthStore((state) => state.user);

    const primaryTo =
        user?.role === 'RECRUITER' ? '/recruiter/positions'
        : user?.role === 'APPLICANT' ? '/jobs'
        : '/auth?mode=register';
    const primaryLabel =
        user?.role === 'RECRUITER' ? 'Recruiter Workspace'
        : user?.role === 'APPLICANT' ? 'Explore Positions'
        : 'Get Started — it’s free';

    return (
        <div className='flex flex-1 flex-col'>
            <main className='relative w-full'>
                <div
                    aria-hidden='true'
                    className='bg-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem]'
                />

                {/* Hero */}
                <section className='mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-14 px-6 pb-16 pt-14 md:pt-20 lg:grid-cols-12'>
                    <div className='animate-fade-up lg:col-span-7'>
                        <span className='eyebrow mb-6'>
                            <Sparkles size={13} />
                            Autonomous recruitment for Algeria
                        </span>
                        <h1 className='font-display text-5xl font-extrabold leading-[1.04] tracking-tight text-(--text-main) sm:text-6xl md:text-7xl'>
                            Hiring shouldn’t end in silence.{' '}
                            <span className='text-gradient'>
                                Match talent on real evidence.
                            </span>
                        </h1>
                        <p className='mt-6 max-w-2xl text-lg leading-relaxed text-(--text-sub) md:text-xl'>
                            Skillora automates screening and scheduling for
                            employers while guaranteeing actionable learning
                            roadmaps to every applicant.
                        </p>

                        <div className='mt-9 flex flex-wrap items-center gap-3'>
                            <Link
                                to={primaryTo}
                                className='btn-primary px-6! py-3.5! text-base!'>
                                {primaryLabel}
                                <ArrowRight size={18} />
                            </Link>
                            <Link
                                to={user ? '/jobs' : '/auth?mode=login'}
                                className='btn-secondary px-6! py-3.5! text-base!'>
                                {user ?
                                    'Explore Open Roles'
                                :   'Sign in to explore roles'}
                            </Link>
                        </div>

                        <div className='mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-(--text-sub)'>
                            <span className='inline-flex items-center gap-2'>
                                <BadgeCheck
                                    size={16}
                                    className='text-forest dark:text-forest-dark'
                                />
                                Verified credentials
                            </span>
                            <span className='inline-flex items-center gap-2'>
                                <BadgeCheck
                                    size={16}
                                    className='text-forest dark:text-forest-dark'
                                />
                                Zero ghosting
                            </span>
                            <span className='inline-flex items-center gap-2'>
                                <BadgeCheck
                                    size={16}
                                    className='text-forest dark:text-forest-dark'
                                />
                                First opening free
                            </span>
                        </div>
                    </div>

                    <div className='relative lg:col-span-5'>
                        <div
                            aria-hidden='true'
                            className='absolute -inset-6 -z-10 rounded-[2.5rem] bg-linear-to-br from-brand-500/25 via-violet-accent/15 to-pink-accent/20 blur-3xl'
                        />
                        <div className='card glass relative p-5 shadow-lg sm:p-6'>
                            <div className='flex items-center justify-between border-b border-(--border-line) pb-3'>
                                <span className='flex items-center gap-2 text-xs font-semibold text-(--text-main)'>
                                    <span className='relative flex h-2 w-2'>
                                        <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-forest opacity-60' />
                                        <span className='relative inline-flex h-2 w-2 rounded-full bg-forest' />
                                    </span>
                                    Evidence routing · live
                                </span>
                                <span className='rounded-full bg-(--bg-panel) px-2 py-0.5 font-mono text-[10px] text-(--text-sub)'>
                                    01 / 03
                                </span>
                            </div>
                            <MatchPathSketch className='mt-4 h-auto w-full text-(--text-main)' />
                            <p className='mt-4 border-t border-(--border-line) pt-3 text-xs leading-relaxed text-(--text-sub)'>
                                Verified evidence sends every application to an
                                interview or a concrete growth path.
                            </p>
                        </div>

                        <div className='card animate-float absolute -left-4 -top-10 hidden items-center gap-3 px-4 py-3 shadow-lg sm:flex lg:-left-14'>
                            <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-forest/10 text-forest dark:text-forest-dark'>
                                <TrendingUp size={18} />
                            </span>
                            <div>
                                <div className='text-[11px] text-(--text-sub)'>
                                    Evidence match
                                </div>
                                <div className='font-display text-lg font-extrabold leading-none text-(--text-main)'>
                                    94%
                                </div>
                            </div>
                        </div>

                        <div className='card animate-float absolute -bottom-6 -right-3 hidden items-center gap-3 px-4 py-3 shadow-lg [animation-delay:1.5s] sm:flex lg:-right-6'>
                            <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300'>
                                <CalendarCheck size={18} />
                            </span>
                            <div>
                                <div className='text-[11px] text-(--text-sub)'>
                                    Interview booked
                                </div>
                                <div className='text-sm font-semibold text-(--text-main)'>
                                    Thu · 10:30
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className='mx-auto w-full max-w-7xl px-6'>
                    <div className='card grid grid-cols-2 divide-(--border-line) md:grid-cols-4 md:divide-x'>
                        {STATS.map((stat) => (
                            <div
                                key={stat.label}
                                className='px-6 py-6 text-center'>
                                <div className='font-display text-3xl font-extrabold tracking-tight text-(--text-main) md:text-4xl'>
                                    {stat.value}
                                </div>
                                <div className='mt-1 text-xs text-(--text-sub) md:text-sm'>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Dual outcome */}
                <section className='mx-auto w-full max-w-7xl px-6 py-24'>
                    <div className='mx-auto mb-12 max-w-2xl text-center'>
                        <span className='eyebrow mb-4'>Dual outcome</span>
                        <h2 className='font-display text-4xl font-extrabold tracking-tight text-(--text-main) md:text-5xl'>
                            One application,{' '}
                            <span className='text-gradient'>
                                two guaranteed outcomes
                            </span>
                        </h2>
                        <p className='mt-4 text-(--text-sub)'>
                            Employers get a verified shortlist. Applicants who
                            fall short get a clear, respectful path forward.
                        </p>
                    </div>

                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                        <div className='card card-hover relative overflow-hidden p-7 md:p-8'>
                            <div
                                aria-hidden='true'
                                className='absolute -right-16 -top-16 h-48 w-48 rounded-full bg-forest/10 blur-2xl'
                            />
                            <div className='mb-6 flex items-center justify-between'>
                                <span className='text-sm font-semibold text-(--text-main)'>
                                    Employer Shortlist
                                </span>
                                <span className='rounded-full bg-forest/10 px-2.5 py-1 text-[11px] font-semibold text-forest dark:text-forest-dark'>
                                    Interview ready
                                </span>
                            </div>
                            <div className='font-mono text-xs text-(--text-sub)'>
                                Candidate #DZ-308
                            </div>
                            <div className='mt-1 font-display text-4xl font-extrabold tracking-tight text-(--text-main)'>
                                94% Evidence Match
                            </div>
                            <div className='mt-5 h-2 w-full overflow-hidden rounded-full bg-(--bg-panel)'>
                                <div className='h-full w-[94%] rounded-full bg-linear-to-r from-forest to-emerald-400' />
                            </div>
                            <ul className='mt-6 space-y-3 text-sm text-(--text-main)'>
                                <li className='flex items-center gap-3'>
                                    <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-(--bg-panel)'>
                                        <GitBranch size={15} />
                                    </span>
                                    3 verified GitHub CI/CD repos
                                </li>
                                <li className='flex items-center gap-3'>
                                    <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-(--bg-panel)'>
                                        <GraduationCap size={15} />
                                    </span>
                                    Ingénieur d'État CS (ESI Algiers)
                                </li>
                            </ul>
                        </div>

                        <div className='card card-hover relative overflow-hidden p-7 md:p-8'>
                            <div
                                aria-hidden='true'
                                className='absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-accent/15 blur-2xl'
                            />
                            <div className='mb-6 flex items-center justify-between'>
                                <span className='text-sm font-semibold text-(--text-main)'>
                                    Applicant Growth Card
                                </span>
                                <span className='rounded-full bg-amber-accent/10 px-2.5 py-1 text-[11px] font-semibold text-amber-accent'>
                                    Feedback issued
                                </span>
                            </div>
                            <p className='text-lg leading-relaxed text-(--text-main)'>
                                Missing Kubernetes orchestration.
                            </p>
                            <div className='mt-4 rounded-xl border border-amber-accent/25 bg-amber-accent/5 p-4 text-sm text-(--text-main)'>
                                <span className='font-semibold'>
                                    Recommended:
                                </span>{' '}
                                Deploy a Helm microservice & re-apply.
                            </div>
                            <Link
                                to={
                                    user?.role === 'APPLICANT' ?
                                        '/applicant/dashboard'
                                    : user ?
                                        '/jobs'
                                    :   '/auth?mode=register'
                                }
                                className='mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-accent transition-all hover:gap-2.5'>
                                {user?.role === 'APPLICANT' ?
                                    'View your feedback dossier'
                                : user ?
                                    'Explore open roles with rubrics'
                                :   'Register to explore roles with rubrics'}
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Steps */}
                <section className='mx-auto w-full max-w-7xl px-6 pb-24'>
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                        {STEPS.map((step, index) => (
                            <div
                                key={step.title}
                                className='card card-hover p-7'>
                                <div className='mb-5 flex items-center justify-between'>
                                    <span className='icon-tile'>
                                        <step.icon size={20} />
                                    </span>
                                    <span className='font-display text-4xl font-extrabold text-(--border-line)'>
                                        0{index + 1}
                                    </span>
                                </div>
                                <h3 className='font-display text-xl font-bold text-(--text-main)'>
                                    {step.title}
                                </h3>
                                <p className='mt-2 text-sm leading-relaxed text-(--text-sub)'>
                                    {step.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                {!user && (
                    <section className='mx-auto w-full max-w-7xl px-6 pb-24'>
                        <div className='relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-600 via-violet-accent to-pink-accent px-8 py-14 text-center text-white shadow-[0_30px_80px_-30px_rgb(99_102_241/0.8)] md:px-16'>
                            <div
                                aria-hidden='true'
                                className='absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]'
                            />
                            <h2 className='relative font-display text-3xl font-extrabold tracking-tight md:text-5xl'>
                                Ready to hire — or get hired — on evidence?
                            </h2>
                            <p className='relative mx-auto mt-4 max-w-xl text-white/80'>
                                Create your free account in under a minute. No
                                credit card required.
                            </p>
                            <div className='relative mt-8 flex flex-wrap justify-center gap-3'>
                                <Link
                                    to='/auth?mode=register'
                                    className='inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-brand-700 shadow-lg transition-transform hover:-translate-y-px'>
                                    Create free account
                                    <ArrowRight size={18} />
                                </Link>
                                <Link
                                    to='/how-it-works'
                                    className='inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white/10'>
                                    See how it works
                                </Link>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <SiteFooter />
        </div>
    );
}
