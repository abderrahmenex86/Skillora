import { Link } from 'react-router-dom';
import { MatchPathSketch } from '../../components/Sketches';
import { useAuthStore } from '../../store/useAuthStore';

export default function LandingView() {
    const user = useAuthStore((state) => state.user);

    return (
        <div className='page-scroll flex flex-col'>
            <main className='max-w-7xl mx-auto px-6 py-14 md:py-20 w-full'>
                <div className='grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center mb-16'>
                    <div className='lg:col-span-7'>
                        <h1 className='font-grotesque font-extrabold text-5xl sm:text-6xl md:text-7xl leading-[0.95] tracking-tight mb-6 text-(--text-main)'>
                            Hiring shouldn’t end in silence. Match talent on
                            real evidence.
                        </h1>
                        <p className='text-lg md:text-xl text-(--text-sub) max-w-2xl leading-relaxed'>
                            Skillora automates screening and scheduling for
                            employers while guaranteeing actionable learning
                            roadmaps to every applicant.
                        </p>

                        <div className='flex flex-wrap items-center gap-4 mt-8'>
                            <Link
                                to={
                                    user?.role === 'RECRUITER' ?
                                        '/recruiter/positions'
                                    : user?.role === 'APPLICANT' ?
                                        '/jobs'
                                    :   '/auth?mode=register'
                                }
                                className='px-6 py-3.5 bg-(--btn-main-bg) text-(--btn-main-text) font-grotesque font-bold text-xl rounded-md hover:opacity-90 transition-opacity'>
                                {user?.role === 'RECRUITER' ?
                                    'Recruiter Workspace'
                                : user?.role === 'APPLICANT' ?
                                    'Explore Jobs'
                                :   'Get Started'}
                            </Link>
                            <Link
                                to={user ? '/jobs' : '/auth?mode=login'}
                                className='px-6 py-3.5 border border-(--border-line) font-grotesque font-bold text-xl rounded-md hover:bg-(--bg-panel) transition-colors text-(--text-main)'>
                                {user ?
                                    'Explore Jobs'
                                :   'Sign In to Explore Jobs'}
                            </Link>
                        </div>
                    </div>

                    <div className='lg:col-span-5'>
                        <div className='rounded-lg border border-(--border-line) bg-(--bg-panel) p-5 sm:p-6'>
                            <div className='flex items-center justify-between border-b border-(--border-line) pb-3'>
                                <span className='font-mono text-[10px] uppercase tracking-[0.18em] text-(--text-sub)'>
                                    Evidence Routing
                                </span>
                                <span className='font-mono text-[10px] text-(--text-sub)'>
                                    01 / 03
                                </span>
                            </div>
                            <MatchPathSketch className='mt-4 h-auto w-full text-(--text-main)' />
                            <p className='mt-4 border-t border-(--border-line) pt-3 font-mono text-[10px] leading-relaxed text-(--text-sub)'>
                                Verified evidence sends every application to an
                                interview or a concrete growth path.
                            </p>
                        </div>
                    </div>
                </div>

                <div className='border border-(--border-line) rounded-lg p-6 md:p-8 bg-(--bg-canvas) max-w-4xl'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-8 items-start'>
                        <div>
                            <div className='text-sm font-semibold mb-4 text-(--text-main)'>
                                Employer Shortlist
                            </div>
                            <div className='bg-(--bg-panel) p-6 rounded-md border border-(--border-line)'>
                                <div className='font-mono text-xs text-(--text-sub) mb-1'>
                                    Candidate #DZ-308
                                </div>
                                <div className='font-grotesque font-extrabold text-3xl md:text-4xl tracking-tight mb-4 text-(--text-main)'>
                                    94% Evidence Match
                                </div>
                                <div className='space-y-2 border-t border-(--border-line) pt-4 text-xs font-mono text-(--text-sub)'>
                                    <div>• 3 verified GitHub CI/CD repos</div>
                                    <div>
                                        • Ingénieur d'État CS (ESI Algiers)
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className='text-sm font-semibold mb-4 text-(--text-main)'>
                                Applicant Growth Card
                            </div>
                            <div className='bg-(--bg-canvas) p-6 rounded-md border-2 border-amber-accent'>
                                <span className='inline-block font-mono text-[11px] text-amber-accent border border-amber-accent/40 px-2 py-0.5 rounded uppercase mb-4 tracking-wider'>
                                    ACTIONABLE FEEDBACK ISSUED
                                </span>
                                <p className='text-sm text-(--text-main) leading-relaxed mb-4 font-sans'>
                                    Missing Kubernetes orchestration.
                                    <br />
                                    <span className='font-medium'>
                                        Recommended:
                                    </span>{' '}
                                    Deploy Helm microservice & re-apply.
                                </p>
                                <Link
                                    to={
                                        user?.role === 'APPLICANT' ?
                                            '/applicant/dashboard'
                                        : user ?
                                            '/jobs'
                                        :   '/auth?mode=register'
                                    }
                                    className='text-xs font-mono text-amber-accent hover:underline block'>
                                    {user?.role === 'APPLICANT' ?
                                        'View your feedback dossier →'
                                    : user ?
                                        'Explore jobs with rubrics →'
                                    :   'Register to explore jobs with rubrics →'
                                    }
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
