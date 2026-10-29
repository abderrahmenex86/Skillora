import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ChapterHeader, SiteFooter } from '../../components/Brand';

export default function AboutView() {
    return (
        <div className='flex flex-1 flex-col'>
            <main className='w-full'>
                <ChapterHeader
                    eyebrow='Our mission'
                    number='About'
                    title='Why Skillora'
                    accent='exists.'
                />

                <section className='mx-auto grid w-full max-w-6xl grid-cols-1 gap-16 px-6 py-20 md:grid-cols-12'>
                    <div className='space-y-6 text-lg font-light leading-[1.85] text-(--text-sub) md:col-span-6'>
                        <p className='dropcap'>
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
                        <p className='kicker pt-4'>
                            Skillora Collective — Algiers, 2026
                        </p>
                    </div>

                    <figure className='relative md:col-span-5 md:col-start-8'>
                        <div
                            aria-hidden='true'
                            className='glow'
                        />
                        <div className='hairline-ink' />
                        <blockquote className='display py-10 text-5xl text-(--text-main) md:text-6xl'>
                            “Every applicant gets either an interview or a path
                            to grow. <em className='italic'>Guaranteed.</em>”
                        </blockquote>
                        <div className='hairline-ink' />
                        <Link
                            to='/auth?mode=register'
                            className='btn-primary mt-10'>
                            Join Skillora
                            <ArrowRight
                                size={14}
                                strokeWidth={1.5}
                            />
                        </Link>
                    </figure>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
