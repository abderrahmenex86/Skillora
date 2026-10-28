import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, MapPin, Quote } from 'lucide-react';
import { SiteFooter } from '../../components/Brand';

export default function AboutView() {
    return (
        <div className='flex flex-1 flex-col'>
            <main className='mx-auto w-full max-w-4xl px-6 py-16 md:py-20'>
                <div className='animate-fade-up'>
                    <span className='eyebrow mb-5'>
                        <HeartHandshake size={13} />
                        Our mission
                    </span>
                    <h1 className='font-display text-5xl font-extrabold tracking-tight text-(--text-main) sm:text-6xl'>
                        Why <span className='text-gradient'>Skillora</span>{' '}
                        exists
                    </h1>
                </div>

                <div className='mt-10 space-y-6 text-lg leading-relaxed text-(--text-sub)'>
                    <p>
                        Every year, thousands of qualified graduates and
                        specialists apply to technical, legal, and corporate
                        roles across Algeria.
                    </p>
                    <p>
                        Their applications vanish into unread inbox black holes.
                        Meanwhile, recruiting teams are overwhelmed with
                        AI-generated resumes and keyword matching software that
                        eliminates genuine talent.
                    </p>
                </div>

                <figure className='relative my-12 overflow-hidden rounded-3xl bg-linear-to-br from-brand-600 via-violet-accent to-pink-accent p-8 text-white shadow-[0_30px_80px_-30px_rgb(99_102_241/0.8)] md:p-10'>
                    <Quote
                        size={40}
                        className='mb-4 opacity-40'
                    />
                    <blockquote className='font-display text-2xl font-bold leading-snug md:text-3xl'>
                        Every applicant gets either an interview or a path to
                        grow. Guaranteed.
                    </blockquote>
                    <figcaption className='mt-4 text-sm text-white/75'>
                        The one promise Skillora was designed around
                    </figcaption>
                </figure>

                <p className='text-lg leading-relaxed text-(--text-sub)'>
                    If a candidate meets the criteria, an interview is
                    coordinated autonomously. If they fall short, they receive
                    an exact breakdown of what was missing and the steps to
                    bridge the gap.
                </p>

                <div className='mt-12 flex flex-col items-start justify-between gap-6 border-t border-(--border-line) pt-8 sm:flex-row sm:items-center'>
                    <div className='flex items-center gap-2 text-sm text-(--text-sub)'>
                        <MapPin size={16} />
                        Skillora Collective · Algiers, Algeria · 2026
                    </div>
                    <Link
                        to='/auth?mode=register'
                        className='btn-primary'>
                        Join Skillora <ArrowRight size={16} />
                    </Link>
                </div>
            </main>

            <SiteFooter tagline='Deterministic hiring protocol for North Africa' />
        </div>
    );
}
