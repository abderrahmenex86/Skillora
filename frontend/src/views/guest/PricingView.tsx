import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Building2,
    Check,
    CheckCircle2,
    Loader2,
    UserRound,
} from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { SiteFooter } from '../../components/Brand';
import {
    CANDIDATE_PACKS,
    COMPANY_PLANS,
    formatDzd,
    type Plan,
} from '../../data/plans';
import { useAuthStore, type User } from '../../store/useAuthStore';

type Audience = 'candidate' | 'company';

interface PlanCardProps {
    plan: Plan;
    ctaLabel: string;
    disabled: boolean;
    loading: boolean;
    onSelect: () => void;
}

function PlanCard({
    plan,
    ctaLabel,
    disabled,
    loading,
    onSelect,
}: PlanCardProps) {
    return (
        <article
            className={`lift relative flex flex-col justify-between p-8 ${
                plan.recommended ? 'card-ink' : 'card'
            }`}>
            {plan.recommended && (
                <span className='kicker absolute right-8 top-8 font-serif text-base! normal-case! tracking-normal! italic'>
                    Most popular
                </span>
            )}
            <div>
                <div className='flex items-start justify-between gap-3'>
                    <span className='kicker'>
                        {plan.label}
                    </span>
                    {plan.savingsPercent > 0 && (
                        <span className={`kicker ${plan.recommended ? 'mr-28' : ''}`}>
                            − {plan.savingsPercent}%
                        </span>
                    )}
                </div>

                <div className='display mt-8 text-6xl text-(--text-main)'>
                    {formatDzd(plan.price)}
                </div>
                <div className='mt-2 text-sm font-light text-(--text-sub)'>
                    {plan.months === 1 ?
                        'Billed monthly'
                    :   `Billed every ${plan.months} months`}
                    {plan.months > 1 && (
                        <> · {formatDzd(plan.monthlyPrice)}/mo</>
                    )}
                </div>

                <p className='mt-6 text-sm font-light leading-relaxed text-(--text-sub)'>
                    {plan.description}
                </p>

                <ul className='mb-10 mt-6 space-y-3 border-t border-(--border-line) pt-6 text-sm font-light text-(--text-main)'>
                    {plan.features.map((feature) => (
                        <li
                            key={feature}
                            className='flex items-start gap-2.5'>
                            <span className='mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center'>
                                <Check
                                    size={13}
                                    strokeWidth={1.5}
                                />
                            </span>
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>

            <button
                type='button'
                onClick={onSelect}
                disabled={disabled || loading}
                className={`w-full ${
                    disabled ?
                        'btn-secondary text-(--text-sub)!'
                    : plan.recommended ?
                        'btn-primary'
                    :   'btn-secondary'
                }`}>
                {loading && (
                    <Loader2
                        size={16}
                        className='animate-spin'
                    />
                )}
                {loading ? 'Activating...' : ctaLabel}
            </button>
        </article>
    );
}

function getApiErrorMessage(error: unknown) {
    if (!axios.isAxiosError(error)) {
        return 'Could not activate this plan. Please try again.';
    }

    const data = error.response?.data as
        | {
              error?: string;
              issues?: Array<{ message?: string }>;
          }
        | undefined;

    if (data?.issues?.length) {
        return data.issues
            .map((issue) => issue.message)
            .filter(Boolean)
            .join(' • ');
    }

    return data?.error || 'Could not activate this plan. Please try again.';
}

export default function PricingView() {
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const navigate = useNavigate();

    const [pendingPlan, setPendingPlan] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSelectPlan = async (plan: Plan, audience: Audience) => {
        if (!user) {
            navigate('/auth?mode=register');
            return;
        }

        const requiredRole =
            audience === 'candidate' ? 'APPLICANT' : 'RECRUITER';
        if (user.role !== requiredRole) return;

        setPendingPlan(plan.id);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            const endpoint =
                audience === 'candidate' ?
                    '/applicant/upgrade-pro'
                :   '/recruiter/upgrade';

            const { data } = await apiClient.post<{
                user: User;
                message?: string;
            }>(endpoint, { months: plan.months });

            setUser(data.user);
            setSuccessMsg(
                audience === 'candidate' ?
                    `${plan.label} candidate pack activated. Unlimited resumes and insights are unlocked.`
                :   `${plan.label} company plan activated. Your hiring pipeline is ready.`
            );

            setTimeout(
                () =>
                    navigate(
                        audience === 'candidate' ?
                            '/applicant/insights'
                        :   '/recruiter/positions'
                    ),
                1500
            );
        } catch (error) {
            setErrorMsg(getApiErrorMessage(error));
            setPendingPlan(null);
        }
    };

    const resolveCta = (plan: Plan, audience: Audience) => {
        const requiredRole =
            audience === 'candidate' ? 'APPLICANT' : 'RECRUITER';

        if (user && user.role !== requiredRole) {
            return {
                label:
                    audience === 'candidate' ?
                        'Candidate accounts only'
                    :   'Recruiter accounts only',
                disabled: true,
            };
        }

        const activeTier =
            audience === 'candidate' ? 'PRO' : 'ENTERPRISE';
        const isActive = user?.subscriptionTier === activeTier;

        return {
            label: `${isActive ? 'Extend' : 'Choose'} ${plan.label}`,
            disabled: false,
        };
    };

    return (
        <div className='flex flex-1 flex-col'>
            <main className='mx-auto w-full max-w-6xl px-6 py-20 md:py-28'>
                <div className='animate-fade-up mx-auto mb-20 max-w-3xl text-center'>
                <span className='kicker'>Pricing</span>
                <h1 className='display mt-6 text-6xl text-(--text-main) sm:text-8xl'>
                    Simple plans for{' '}
                    <em className='italic'>candidates & companies.</em>
                </h1>
                <p className='lead mx-auto mt-8 max-w-xl'>
                    Buy access in packs that match your search. Candidates
                    unlock unlimited resumes and cross-round insights, while
                    companies get a verified hiring pipeline.
                </p>
                </div>

                {successMsg && (
                    <div className='mb-8 flex items-center gap-2 border border-(--text-main) p-4 text-sm text-(--text-main)'>
                        <CheckCircle2 size={16} /> {successMsg}
                    </div>
                )}

                {errorMsg && (
                    <div className='mb-8 border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400'>
                        {errorMsg}
                    </div>
                )}

                <section className='mb-20'>
                    <div className='mb-10 flex flex-wrap items-end justify-between gap-3'>
                        <div>
                            <div className='kicker mb-3 flex! items-center gap-2'>
                                <UserRound size={14} /> Candidate Packs
                            </div>
                            <h2 className='display text-5xl text-(--text-main) md:text-6xl'>
                                Unlimited access, bought as a pack
                            </h2>
                        </div>
                        {user?.subscriptionTier === 'PRO' && (
                            <span className='font-serif text-lg italic text-(--text-main)'>
                                ACTIVE PRO PACK
                            </span>
                        )}
                    </div>

                    {user?.subscriptionTier === 'PRO' && (
                        <div className='mb-8 border-l-2 border-(--text-main) px-4 py-3 text-sm text-(--text-sub)'>
                            Your current pack is active. Choosing another pack
                            adds its duration from your existing expiry date.
                        </div>
                    )}

                    <div className='grid grid-cols-1 gap-5 md:grid-cols-3'>
                        {CANDIDATE_PACKS.map((plan) => {
                            const cta = resolveCta(plan, 'candidate');
                            return (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    ctaLabel={cta.label}
                                    disabled={cta.disabled}
                                    loading={pendingPlan === plan.id}
                                    onSelect={() =>
                                        handleSelectPlan(plan, 'candidate')
                                    }
                                />
                            );
                        })}
                    </div>

                    <div className='mt-8 border-l-2 border-(--text-main) px-5 py-4 text-sm text-(--text-sub)'>
                        New candidate accounts start free with one active
                        resume and the standard application queue. Pick a pack
                        when you need unlimited resumes and personalized
                        insights.{' '}
                        {!user && (
                            <Link
                                to='/auth?mode=register'
                                className='font-medium text-(--text-main) underline underline-offset-4'>
                                Create a free account
                            </Link>
                        )}
                    </div>
                </section>

                <section>
                    <div className='mb-10 flex flex-wrap items-end justify-between gap-3'>
                        <div>
                            <div className='kicker mb-3 flex! items-center gap-2'>
                                <Building2 size={14} /> Company Plans
                            </div>
                            <h2 className='display text-5xl text-(--text-main) md:text-6xl'>
                                A verified pipeline for hiring teams
                            </h2>
                        </div>
                        {user?.subscriptionTier === 'ENTERPRISE' && (
                            <span className='font-serif text-lg italic text-(--text-main)'>
                                ACTIVE COMPANY PLAN
                            </span>
                        )}
                    </div>

                    {user?.subscriptionTier === 'ENTERPRISE' && (
                        <div className='mb-8 border-l-2 border-(--text-main) px-4 py-3 text-sm text-(--text-sub)'>
                            Your company plan is active. Choosing another plan
                            adds its duration from your existing expiry date.
                        </div>
                    )}

                    <div className='mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2'>
                        {COMPANY_PLANS.map((plan) => {
                            const cta = resolveCta(plan, 'company');
                            return (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    ctaLabel={cta.label}
                                    disabled={cta.disabled}
                                    loading={pendingPlan === plan.id}
                                    onSelect={() =>
                                        handleSelectPlan(plan, 'company')
                                    }
                                />
                            );
                        })}
                    </div>

                    <div className='mt-8 border-l-2 border-(--text-main) px-5 py-4 text-sm text-(--text-sub)'>
                        Company plans require a recruiter account. Register as
                        a hiring team to activate a monthly or annual plan.
                    </div>
                </section>
            </main>

            <SiteFooter tagline='All plans billed in DZD · Packs activate immediately' />
        </div>
    );
}
