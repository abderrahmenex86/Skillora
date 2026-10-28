import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { ChapterHeader, SiteFooter } from '../../components/Brand';

export default function AboutView() {
    return (
        <div className='flex flex-1 flex-col'>
            <main className='w-full'>
                <ChapterHeader
                    eyebrow='Our mission'
                    title='Why Skillora exists.'
                    tone='amber'>
                    Hiring is broken on both sides of the table.
                </ChapterHeader>

                <section className='mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-12'>
                    <div className='space-y-6 text-lg leading-relaxed text-(--text-sub) lg:col-span-7'>
                        <p>
                            Every year, thousands of qualified graduates and
                            specialists apply to technical, legal, and
                            corporate roles across Algeria.
                        </p>
                        <p>
                            Their applications vanish into unread inbox black
                            holes. Meanwhile, recruiting teams are overwhelmed
                            with AI-generated resumes and keyword matching
                            software that eliminates genuine talent.
                        </p>
                        <p>
                            If a candidate meets the criteria, an interview is
                            coordinated autonomously. If they fall short, they
                            receive an exact breakdown of what was missing and
                            the steps to bridge the gap.
                        </p>
                        <div className='flex flex-col items-start gap-6 border-t border-(--border-line) pt-8 sm:flex-row sm:items-center sm:justify-between'>
                            <span className='flex items-center gap-2 text-sm'>
                                <MapPin size={16} />
                                Skillora Collective · Algiers, Algeria · 2026
                            </span>
                            <Link
                                to='/auth?mode=register'
                                className='btn-primary'>
                                Join Skillora <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    <figure className='card-dark self-start p-8 md:p-10 lg:col-span-5'>
                        <span className='eyebrow'>The promise</span>
                        <blockquote className='display mt-4 text-5xl text-white'>
                            Every applicant gets either an interview or a path
                            to grow.{' '}
                            <span className='text-emerald-brand'>
                                Guaranteed.
                            </span>
                        </blockquote>
                        <figcaption className='mt-6 text-sm text-sage-400'>
                            The one promise Skillora was designed around.
                        </figcaption>
                    </figure>
                </section>
            </main>

            <SiteFooter tagline='Deterministic hiring protocol for North Africa' />
        </div>
    );
}
