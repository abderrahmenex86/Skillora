export default function AboutView() {
    return (
        <div className='flex-1 flex flex-col justify-between'>
            <main className='max-w-4xl mx-auto px-6 py-12 tall:py-16 w-full'>
                <h1 className='font-grotesque font-extrabold text-5xl sm:text-6xl text-(--text-main) tracking-tight mb-6 tall:mb-8'>
                    Why Skillora Exists
                </h1>

                <div className='space-y-5 tall:space-y-6 text-base text-(--text-sub) leading-relaxed font-sans'>
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
                    <p>
                        Skillora was designed around one promise:{' '}
                        <strong className='text-(--text-main)'>
                            Every applicant gets either an interview or a path
                            to grow. Guaranteed.
                        </strong>
                    </p>
                    <p>
                        If a candidate meets the criteria, an interview is
                        coordinated autonomously. If they fall short, they
                        receive an exact breakdown of what was missing and the
                        steps to bridge the gap.
                    </p>
                </div>

                <div className='mt-10 pt-6 tall:mt-12 tall:pt-8 border-t border-(--border-line) font-mono text-xs text-(--text-sub)'>
                    Skillora Collective • Algiers, Algeria • 2026
                </div>
            </main>

            <footer className='border-t border-(--border-line) py-4 tall:py-6 px-6 text-xs font-mono text-(--text-sub) max-w-7xl mx-auto w-full text-center'>
                Deterministic Hiring Protocol for North Africa
            </footer>
        </div>
    );
}
