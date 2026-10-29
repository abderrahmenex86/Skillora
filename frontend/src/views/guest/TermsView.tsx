import Footer from '../../components/Footer';

export default function TermsView() {
    return (
        <div className='page-scroll flex flex-col'>
            <main className='mx-auto w-full max-w-3xl px-6 py-10 tall:py-16'>
                <p className='font-mono text-[10px] uppercase tracking-[0.2em] text-(--text-sub)'>
                    Legal
                </p>
                <h1 className='mt-2 font-grotesque text-5xl font-extrabold tracking-tight text-(--text-main)'>
                    Terms of Service
                </h1>
                <p className='mt-3 text-sm text-(--text-sub)'>
                    Last updated 29 October 2026.
                </p>

                <div className='mt-8 space-y-8 text-sm leading-relaxed text-(--text-sub)'>
                    <section>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Using Skillora
                        </h2>
                        <p className='mt-2'>
                            Skillora helps applicants build role-specific
                            resumes and helps hiring teams review candidates
                            against verified criteria. You must provide accurate
                            account information and use the service lawfully.
                        </p>
                    </section>

                    <section>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Accounts
                        </h2>
                        <p className='mt-2'>
                            You are responsible for activity under your account
                            and for keeping your credentials secure. Notify us
                            promptly if you believe your account has been
                            compromised. You can reset your password from the
                            login screen.
                        </p>
                    </section>

                    <section>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Applications and feedback
                        </h2>
                        <p className='mt-2'>
                            Applying does not guarantee an interview or a job
                            offer. Every application receives a decision; if a
                            role is not a match, the feedback describes the
                            missing criteria and a suggested next step. Do not
                            submit content you do not have the right to share.
                        </p>
                    </section>

                    <section>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Acceptable use
                        </h2>
                        <p className='mt-2'>
                            Do not attempt to access other users' data, scrape
                            the service at scale, submit misleading
                            credentials, or interfere with the platform. We may
                            suspend accounts that violate these rules.
                        </p>
                    </section>

                    <section>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Availability and changes
                        </h2>
                        <p className='mt-2'>
                            The service is provided as-is while the product is
                            under active development. Features may change, and
                            planned maintenance may interrupt access. We will
                            post material changes to these terms on this page.
                        </p>
                    </section>

                    <section>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Contact
                        </h2>
                        <p className='mt-2'>
                            Questions about these terms? Email{' '}
                            <a
                                href='mailto:contact@skillora.dz'
                                className='font-semibold text-(--text-main) underline'>
                                contact@skillora.dz
                            </a>
                            .
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
