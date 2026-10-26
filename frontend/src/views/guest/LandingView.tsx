import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function LandingView() {
    const user = useAuthStore((state) => state.user);

    return (
        <div className='flex-1 flex flex-col justify-between'>
            <main className='max-w-7xl mx-auto px-6 py-14 md:py-20 w-full'>
                <div className='mb-4'>
                    <span className='font-mono text-xs uppercase tracking-wider text-(--text-sub)'>
                        [AUTONOMOUS TALENT PIPELINE • ZERO GHOSTING]
                    </span>
                </div>

                <div className='max-w-4xl mb-10'>
                    <h1 className='font-grotesque font-extrabold text-5xl sm:text-6xl md:text-7xl leading-[0.95] tracking-tight mb-6 text-(--text-main)'>
                        Hiring shouldn’t end in silence. Match talent on real
                        evidence.
                    </h1>
                    <p className='text-lg md:text-xl text-(--text-sub) max-w-2xl leading-relaxed'>
                        Skillora automates screening and scheduling for
                        employers while guaranteeing actionable learning
                        roadmaps to every applicant.
                    </p>
                </div>

                <div className='flex flex-wrap items-center gap-4 mb-16'>
                    <Link
                        to={
                            user?.role === 'RECRUITER' ? '/recruiter/positions'
                            : user?.role === 'APPLICANT' ?
                                '/jobs'
                            :   '/auth?mode=register'
                        }
                        className='px-6 py-3.5 bg-(--btn-main-bg) text-(--btn-main-text) font-grotesque font-bold text-xl rounded-md hover:opacity-90 transition-opacity'>
                        {user?.role === 'RECRUITER' ?
                            'Recruiter Workspace'
                        : user?.role === 'APPLICANT' ?
                            'Explore Positions'
                        :   'Get Started'}
                    </Link>
                    <Link
                        to='/jobs'
                        className='px-6 py-3.5 border border-(--border-line) font-grotesque font-bold text-xl rounded-md hover:bg-(--bg-panel) transition-colors text-(--text-main)'>
                        Explore Open Roles
                    </Link>
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
                                        :   '/jobs'
                                    }
                                    className='text-xs font-mono text-amber-accent hover:underline block'>
                                    {user?.role === 'APPLICANT' ?
                                        'View your feedback dossier →'
                                    :   'Explore open roles with rubrics →'}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className='border-t border-(--border-line) py-6 px-6 text-xs font-mono text-(--text-sub) max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-2'>
                <div>Skillora © 2026 • Multilingual parsing (FR/EN/AR)</div>
                <div>[Algeria Talent Infrastructure]</div>
            </footer>
        </div>
    );
}
