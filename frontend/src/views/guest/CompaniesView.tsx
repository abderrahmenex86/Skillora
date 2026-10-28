import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Terminal, Users } from 'lucide-react';
import { ChapterHeader, SiteFooter } from '../../components/Brand';

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
            <main className='w-full'>
                <ChapterHeader
                    eyebrow='For hiring teams'
                    title='Stop screening 500 unvetted CVs'
                    accent='per opening.'>
                    Engineering managers and HR leads lose dozens of hours every
                    week reading inflated resumes. Skillora delivers{' '}
                    <span className='text-white'>
                        verified candidate dossiers
                    </span>{' '}
                    where claimed competencies are backed by evidence.
                </ChapterHeader>

                <section className='mx-auto w-full max-w-7xl px-6 pt-20'>
                    <span className='eyebrow'>What you get</span>
                    <h2 className='display mt-2 text-5xl text-(--text-main) md:text-7xl'>
                        A shortlist you can{' '}
                        <span className='text-accent'>trust.</span>
                    </h2>
                    <div className='mt-10 grid grid-cols-1 gap-5 md:grid-cols-3'>
                        {FEATURES.map((feature, index) => (
                            <div
                                key={feature.title}
                                className={`card-hover p-8 ${index === 2 ? 'card-dark' : 'card'}`}>
                                <span className='icon-tile'>
                                    <feature.icon size={20} />
                                </span>
                                <h3 className='display mt-6 text-4xl text-(--text-main)'>
                                    {feature.title}
                                </h3>
                                <p className='mt-2 text-sm leading-relaxed text-(--text-sub)'>
                                    {feature.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className='mx-auto w-full max-w-7xl px-4 py-20 sm:px-6'>
                    <div className='panel-emerald rounded-3xl px-7 py-14 sm:px-12'>
                        <div
                            aria-hidden='true'
                            className='orbit -right-20 -top-20 h-80 w-80 border-ink/15!'
                        />
                        <div className='relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-end'>
                            <div>
                                <h3 className='display text-5xl text-ink md:text-6xl'>
                                    Ready to deploy your candidate cohort?
                                </h3>
                                <p className='mt-3 text-ink/75'>
                                    First job opening completely free.
                                    Automated calendar coordination included.
                                </p>
                            </div>
                            <Link
                                to='/auth?mode=register'
                                className='btn-ink shrink-0'>
                                Open Recruiter Account <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <SiteFooter tagline='Used by teams across Algiers, Oran & Constantine' />
        </div>
    );
}
