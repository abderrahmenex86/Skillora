import Footer from '../../components/Footer';

export default function PrivacyView() {
    return (
        <div className='page-scroll flex flex-col'>
            <main className='mx-auto w-full max-w-3xl px-6 py-10 tall:py-16'>
                <p className='font-mono text-[10px] uppercase tracking-[0.2em] text-(--text-sub)'>
                    Legal
                </p>
                <h1 className='mt-2 font-grotesque text-5xl font-extrabold tracking-tight text-(--text-main)'>
                    Privacy Policy
                </h1>
                <p className='mt-3 text-sm text-(--text-sub)'>
                    Last updated 29 October 2026.
                </p>

                <div className='mt-8 space-y-8 text-sm leading-relaxed text-(--text-sub)'>
                    <section>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            What we collect
                        </h2>
                        <p className='mt-2'>
                            We collect the details you provide when you create
                            an account (name, email, phone, wilaya, and company
                            for recruiters), the resumes and information you add
                            to your profile, and the applications and messages
                            you send through Skillora.
                        </p>
                    </section>

                    <section>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            How we use it
                        </h2>
                        <p className='mt-2'>
                            We use your information to operate your account,
                            evaluate applications against the role's rubric,
                            schedule interviews, send application updates, and
                            provide feedback. Recruiters see the information you
                            choose to include in a tailored resume; candidate
                            identities are anonymized in the review pipeline
                            until the workflow requires them.
                        </p>
                    </section>

                    <section>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Sharing
                        </h2>
                        <p className='mt-2'>
                            We share application materials with the hiring team
                            for the position you applied to. We do not sell
                            personal data. Service providers that help us run
                            the platform process data on our instructions.
                        </p>
                    </section>

                    <section>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Retention
                        </h2>
                        <p className='mt-2'>
                            We keep account and application data while your
                            account is active and for a reasonable period
                            afterward for audit, legal, and operational needs.
                            You can request deletion of your account data.
                        </p>
                    </section>

                    <section>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Your choices
                        </h2>
                        <p className='mt-2'>
                            You can update your profile, resumes, and contact
                            details from your workspace. To request a copy or
                            deletion of your data, email us from the address on
                            your account.
                        </p>
                    </section>

                    <section>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Contact
                        </h2>
                        <p className='mt-2'>
                            Privacy questions? Email{' '}
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
