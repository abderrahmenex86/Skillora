import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ChapterHeader, SiteFooter } from '../../components/Brand';

const FEATURES = [
    {
        title: 'Verifiable rubrics',
        text: 'Specify mandatory proofs: public commits, Docker configurations, Go/Python APIs, bar credentials, or university diplomas.',
    },
    {
        title: 'Pre-deadline override',
        text: 'Recruiters retain full authority: manually promote or decline candidate decisions at any time prior to the position closing deadline.',
    },
    {
        title: 'Zero-ghosting brand protection',
        text: 'Preserve your employer reputation. Applicants not selected receive courteous, actionable learning roadmaps instead of silence.',
    },
];

export default function CompaniesView() {
    return (
        <div className='flex flex-1 flex-col'>
            <main className='w-full'>
                <ChapterHeader
                    eyebrow='For hiring teams'
                    number='Companies'
                    title='Stop screening 500 unvetted CVs'
                    accent='per opening.'>
                    Skillora delivers verified candidate dossiers where claimed
                    competencies are backed by evidence.
                </ChapterHeader>

                <section className='mx-auto w-full max-w-6xl px-6'>
                    <div className='grid grid-cols-1 md:grid-cols-3'>
                        {FEATURES.map((feature, index) => (
                            <div
                                key={feature.title}
                                className={`py-14 md:px-8 ${index === 0 ? 'md:pl-0' : 'md:border-l md:border-(--border-line)'} ${index === 2 ? 'md:pr-0' : ''}`}>
                                <span className='font-serif text-xl italic text-(--text-sub)'>
                                    {['I', 'II', 'III'][index]}.
                                </span>
                                <h3 className='display mt-6 text-4xl text-(--text-main)'>
                                    {feature.title}
                                </h3>
                                <p className='mt-4 font-light leading-relaxed text-(--text-sub)'>
                                    {feature.text}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className='card-ink relative mb-24 mt-10 overflow-hidden p-10 md:p-16'>
                        <div className='flex flex-col items-start justify-between gap-10 md:flex-row md:items-end'>
                            <div>
                                <span className='kicker'>Begin</span>
                                <h3 className='display mt-4 text-5xl md:text-6xl'>
                                    Meet your <em className='italic'>shortlist.</em>
                                </h3>
                                <p className='mt-4 max-w-md font-light text-(--text-sub)'>
                                    First job opening completely free. Automated
                                    calendar coordination included.
                                </p>
                            </div>
                            <Link
                                to='/auth?mode=register'
                                className='btn-secondary shrink-0'>
                                Open a recruiter account
                                <ArrowRight
                                    size={14}
                                    strokeWidth={1.5}
                                />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
