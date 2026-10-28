import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    ShieldCheck,
    Terminal,
    Users,
} from 'lucide-react';
import { SiteFooter } from '../../components/Brand';

const FEATURES = [
    {
        icon: Terminal,
        title: 'Verifiable Rubrics',
        text: 'Specify mandatory proofs: public commits, Docker configurations, Go/Python APIs, bar credentials, or university diplomas.',
    },
    {
        icon: ShieldCheck,
        title: 'Pre-Deadline Override',
        text: 'Recruiters retain full authority: manually promote or decline candidate decisions at any time prior to the position closing deadline.',
    },
    {
        icon: Users,
        title: 'Zero-Ghosting Brand Protection',
        text: 'Preserve your employer reputation. Applicants not selected receive courteous, actionable learning roadmaps instead of silence.',
    },
];

export default function CompaniesView() {
    return (
        <div className='flex flex-1 flex-col'>
            <main className='mx-auto w-full max-w-6xl px-6 py-16 md:py-20'>
                <div className='animate-fade-up max-w-3xl'>
                    <span className='eyebrow mb-5'>
                        <Building2 size={13} />
                        For hiring teams
                    </span>
                    <h1 className='font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-(--text-main) sm:text-6xl'>
                        Stop screening{' '}
                        <span className='text-gradient'>500 unvetted CVs</span>{' '}
                        per opening.
                    </h1>
                    <p className='mt-6 max-w-2xl text-lg leading-relaxed text-(--text-sub)'>
                        Engineering managers and HR leads lose dozens of hours
                        every week reading inflated resumes. Skillora delivers
                        verified candidate dossiers where claimed competencies
                        are backed by evidence.
                    </p>
                </div>

                <div className='mt-14 grid grid-cols-1 gap-6 md:grid-cols-3'>
                    {FEATURES.map((feature) => (
                        <div
                            key={feature.title}
                            className='card card-hover p-7'>
                            <span className='icon-tile mb-5'>
                                <feature.icon size={20} />
                            </span>
                            <h3 className='font-display text-xl font-bold text-(--text-main)'>
                                {feature.title}
                            </h3>
                            <p className='mt-2 text-sm leading-relaxed text-(--text-sub)'>
                                {feature.text}
                            </p>
                        </div>
                    ))}
                </div>

                <div className='relative mt-14 overflow-hidden rounded-3xl bg-linear-to-br from-brand-600 via-violet-accent to-pink-accent p-8 text-white shadow-[0_30px_80px_-30px_rgb(99_102_241/0.8)] md:p-12'>
                    <div
                        aria-hidden='true'
                        className='absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]'
                    />
                    <div className='relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center'>
                        <div>
                            <h3 className='font-display text-3xl font-extrabold tracking-tight md:text-4xl'>
                                Ready to deploy your candidate cohort?
                            </h3>
                            <ul className='mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85'>
                                <li className='flex items-center gap-2'>
                                    <CheckCircle2 size={16} /> First job
                                    opening completely free
                                </li>
                                <li className='flex items-center gap-2'>
                                    <CheckCircle2 size={16} /> Automated
                                    calendar coordination included
                                </li>
                            </ul>
                        </div>
                        <Link
                            to='/auth?mode=register'
                            className='inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-brand-700 shadow-lg transition-transform hover:-translate-y-px'>
                            Open Recruiter Account <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </main>

            <SiteFooter tagline='Used by teams across Algiers, Oran & Constantine' />
        </div>
    );
}
