import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Building2,
    GitBranch,
    GraduationCap,
    Sprout,
} from 'lucide-react';
import { MatchPathSketch } from '../../components/Sketches';
import { PipelineFlow, SiteFooter } from '../../components/Brand';
import { useAuthStore } from '../../store/useAuthStore';

const CHIPS = [
    'Zero ghosting',
    'Pre-vetted shortlists',
    'Feedback for every applicant',
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
        : 'Get Started';

    return (
        <div className='flex flex-1 flex-col'>
            <main className='w-full'>
                {/* ── Hero · deck title slide ───────────────────────────── */}
                <section className='mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6'>
                    <div className='panel-dark rounded-3xl px-7 pb-14 pt-14 sm:px-12 md:pb-20 md:pt-20'>
                        <div
                            aria-hidden='true'
                            className='orbit -right-28 -top-28 hidden h-[30rem] w-[30rem] lg:block'
                        />
                        <div
                            aria-hidden='true'
                            className='orbit right-4 top-4 hidden h-72 w-72 lg:block'>
                            <span className='absolute -top-1 left-1/2 h-2 w-2 rounded-full bg-emerald-brand shadow-[0_0_12px_3px_rgb(16_185_129/0.8)]' />
                            <span className='absolute -left-1 top-1/2 h-2 w-2 rounded-full bg-amber-soft shadow-[0_0_12px_3px_rgb(240_164_67/0.6)]' />
                        </div>

                        <div className='relative grid grid-cols-1 items-center gap-12 lg:grid-cols-12'>
                            <div className='animate-fade-up lg:col-span-7'>
                                <span className='eyebrow-pill'>
                                    Multi-agent AI recruiting
                                </span>
                                <h1 className='display mt-7 text-6xl text-white sm:text-7xl md:text-[6.5rem]'>
                                    Hiring shouldn’t end in silence.{' '}
                                    <span className='text-emerald-brand'>
                                        Match talent on real evidence.
                                    </span>
                                </h1>
                                <p className='mt-6 max-w-xl text-lg leading-relaxed text-sage-400 md:text-xl'>
                                    The self-driving recruiting pipeline that{' '}
                                    <span className='text-white'>
                                        never ghosts a candidate.
                                    </span>
                                </p>

                                <div className='mt-9 flex flex-wrap items-center gap-3'>
                                    <Link
                                        to={primaryTo}
                                        className='btn-primary px-6! py-3.5! text-base!'>
                                        {primaryLabel}
                                        <ArrowRight size={18} />
                                    </Link>
                                    <Link
                                        to={
                                            user ? '/jobs' : '/auth?mode=login'
                                        }
                                        className='btn-secondary px-6! py-3.5! text-base! text-white!'>
                                        {user ?
                                            'Explore Open Roles'
                                        :   'Sign in to explore roles'}
                                    </Link>
                                </div>

                                <div className='mt-8 flex flex-wrap gap-2'>
                                    {CHIPS.map((chip) => (
                                        <span
                                            key={chip}
                                            className='chip'>
                                            {chip}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className='lg:col-span-5'>
                                <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm sm:p-6'>
                                    <div className='flex items-center justify-between border-b border-white/10 pb-3'>
                                        <span className='flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-brand'>
                                            <span className='relative flex h-2 w-2'>
                                                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-brand opacity-60' />
                                                <span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-brand' />
                                            </span>
                                            Evidence routing
                                        </span>
                                        <span className='text-[11px] text-sage-500'>
                                            01 / 03
                                        </span>
                                    </div>
                                    <MatchPathSketch className='mt-4 h-auto w-full text-white/85' />
                                    <p className='mt-4 border-t border-white/10 pt-3 text-xs leading-relaxed text-sage-400'>
                                        Verified evidence sends every
                                        application to an interview or a
                                        concrete growth path.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── The problem ───────────────────────────────────────── */}
                <section className='mx-auto w-full max-w-7xl px-6 pt-24'>
                    <span className='eyebrow eyebrow-amber'>The problem</span>
                    <h2 className='display mt-2 text-5xl text-(--text-main) md:text-7xl'>
                        Ambition dies in the black hole.
                    </h2>

                    <div className='mt-10 grid grid-cols-1 gap-5 md:grid-cols-2'>
                        <div className='card-dark card-hover p-8 md:p-10'>
                            <span className='eyebrow'>Applicants</span>
                            <div className='display mt-3 text-7xl text-emerald-brand md:text-8xl'>
                                Ghosted.
                            </div>
                            <p className='mt-4 text-lg text-sage-300'>
                                Applications vanish with{' '}
                                <span className='font-bold text-white'>
                                    zero feedback.
                                </span>
                            </p>
                        </div>
                        <div className='card card-hover p-8 md:p-10'>
                            <span className='eyebrow eyebrow-amber'>
                                Recruiters
                            </span>
                            <div className='display mt-3 text-7xl text-amber-accent md:text-8xl'>
                                Flooded.
                            </div>
                            <p className='mt-4 text-lg text-(--text-sub)'>
                                Buried under{' '}
                                <span className='font-bold text-(--text-main)'>
                                    hundreds of résumés
                                </span>{' '}
                                every day.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── The solution ──────────────────────────────────────── */}
                <section className='mx-auto w-full max-w-7xl px-6 pt-24'>
                    <span className='eyebrow'>The solution</span>
                    <h2 className='display mt-2 text-5xl text-(--text-main) md:text-7xl'>
                        Intelligent triage.{' '}
                        <span className='text-accent'>Zero ghosting.</span>
                    </h2>

                    <div className='mt-10 grid grid-cols-1 gap-5 md:grid-cols-2'>
                        {/* For employers */}
                        <div className='card-dark card-hover p-8 md:p-10'>
                            <span className='icon-tile'>
                                <Building2 size={20} />
                            </span>
                            <h3 className='display mt-5 text-5xl text-white'>
                                For employers
                            </h3>
                            <p className='mt-2 text-sage-400'>
                                An autonomous multi-agent pipeline that
                                delivers{' '}
                                <span className='text-emerald-brand'>
                                    pre-vetted shortlists
                                </span>
                                , not piles of résumés.
                            </p>

                            <div className='mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-5'>
                                <div className='flex items-center justify-between'>
                                    <span className='font-mono text-xs text-sage-400'>
                                        Candidate #DZ-308
                                    </span>
                                    <span className='rounded-full bg-emerald-brand px-2.5 py-0.5 text-[11px] font-bold text-ink'>
                                        Interview
                                    </span>
                                </div>
                                <div className='display mt-2 text-5xl text-white'>
                                    94% Evidence Match
                                </div>
                                <div className='mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10'>
                                    <div className='h-full w-[94%] rounded-full bg-emerald-brand' />
                                </div>
                                <ul className='mt-5 space-y-2.5 text-sm text-sage-300'>
                                    <li className='flex items-center gap-2.5'>
                                        <GitBranch
                                            size={15}
                                            className='text-emerald-brand'
                                        />
                                        3 verified GitHub CI/CD repos
                                    </li>
                                    <li className='flex items-center gap-2.5'>
                                        <GraduationCap
                                            size={15}
                                            className='text-emerald-brand'
                                        />
                                        Ingénieur d'État CS (ESI Algiers)
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* For applicants */}
                        <div className='card card-hover p-8 md:p-10'>
                            <span className='icon-tile icon-tile-amber'>
                                <Sprout size={20} />
                            </span>
                            <h3 className='display mt-5 text-5xl text-(--text-main)'>
                                For applicants
                            </h3>
                            <p className='mt-2 text-(--text-sub)'>
                                Every applicant gets{' '}
                                <span className='font-bold text-(--text-main)'>
                                    actionable growth feedback
                                </span>
                                , guaranteed, whatever the outcome.
                            </p>

                            <div className='mt-8 rounded-xl border border-amber-accent/30 bg-amber-accent/[0.06] p-5'>
                                <span className='eyebrow eyebrow-amber'>
                                    Growth path issued
                                </span>
                                <p className='mt-2 font-semibold text-(--text-main)'>
                                    Missing Kubernetes orchestration.
                                </p>
                                <p className='mt-1 text-sm text-(--text-sub)'>
                                    Recommended: deploy a Helm microservice
                                    & re-apply.
                                </p>
                                <Link
                                    to={
                                        user?.role === 'APPLICANT' ?
                                            '/applicant/dashboard'
                                        : user ?
                                            '/jobs'
                                        :   '/auth?mode=register'
                                    }
                                    className='text-amber mt-4 inline-flex items-center gap-1.5 text-sm font-bold transition-all hover:gap-2.5'>
                                    {user?.role === 'APPLICANT' ?
                                        'View your feedback dossier'
                                    : user ?
                                        'Explore open roles with rubrics'
                                    :   'Register to explore roles with rubrics'
                                    }
                                    <ArrowRight size={15} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── How it works · pipeline ───────────────────────────── */}
                <section className='mx-auto w-full max-w-7xl px-4 pt-24 sm:px-6'>
                    <div className='panel-dark rounded-3xl px-7 py-14 sm:px-12'>
                        <span className='eyebrow'>How it works</span>
                        <h2 className='display mb-12 mt-2 text-5xl text-white md:text-7xl'>
                            From PDF to interview, on autopilot.
                        </h2>
                        <PipelineFlow />
                        <Link
                            to='/how-it-works'
                            className='mt-10 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-brand transition-all hover:gap-2.5'>
                            See the full process <ArrowRight size={15} />
                        </Link>
                    </div>
                </section>

                {/* ── CTA · deck closing slide ──────────────────────────── */}
                {!user && (
                    <section className='mx-auto w-full max-w-7xl px-4 py-24 sm:px-6'>
                        <div className='panel-emerald rounded-3xl px-7 py-16 sm:px-12'>
                            <div
                                aria-hidden='true'
                                className='orbit -right-20 -top-20 h-80 w-80 border-ink/15!'
                            />
                            <span className='eyebrow text-ink!'>Skillora</span>
                            <h2 className='display relative mt-2 text-6xl text-ink md:text-8xl'>
                                Never ghost a candidate.
                            </h2>
                            <p className='relative mt-4 max-w-xl text-lg text-ink/75'>
                                Create your free account and get your first
                                verified shortlist — or your first growth path.
                            </p>
                            <div className='relative mt-8 flex flex-wrap gap-3'>
                                <Link
                                    to='/auth?mode=register'
                                    className='btn-ink'>
                                    Create free account
                                    <ArrowRight size={18} />
                                </Link>
                                <Link
                                    to='/companies'
                                    className='inline-flex items-center gap-2 rounded-full border border-ink/40 px-5 py-3 font-semibold text-ink transition-colors hover:bg-ink/5'>
                                    For companies
                                </Link>
                            </div>
                        </div>
                    </section>
                )}
                {user && <div className='pb-24' />}
            </main>

            <SiteFooter />
        </div>
    );
}
