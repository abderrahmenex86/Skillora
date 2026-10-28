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
            className={`relative flex flex-col justify-between rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 ${
                plan.recommended ?
                    'border border-brand-400/70 bg-(--bg-elevated) ring-4 ring-brand-500/10 shadow-[0_24px_60px_-24px_rgb(99_102_241/0.55)]'
                :   'border border-(--border-line) bg-(--bg-elevated) shadow-sm hover:shadow-lg'
            }`}>
            {plan.recommended && (
                <span className='absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-linear-to-r from-brand-600 to-violet-accent px-3 py-1 text-[11px] font-semibold text-white shadow-md'>
                    Most popular
                </span>
            )}
            <div>
                <div className='flex items-start justify-between gap-3'>
                    <span className='font-display text-lg font-bold text-(--text-main)'>
                        {plan.label}
                    </span>
                    {plan.savingsPercent > 0 && (
                        <span className='rounded-full bg-forest/10 px-2.5 py-1 text-[11px] font-semibold text-forest dark:text-forest-dark'>
                            Save {plan.savingsPercent}%
                        </span>
                    )}
                </div>

                <div className='mt-5 font-display text-4xl font-extrabold tracking-tight text-(--text-main)'>
                    {formatDzd(plan.price)}
                </div>
                <div className='mt-1 text-sm text-(--text-sub)'>
                    {plan.months === 1 ?
                        'Billed monthly'
                    :   `Billed every ${plan.months} months`}
                    {plan.months > 1 && (
                        <> · {formatDzd(plan.monthlyPrice)}/mo</>
                    )}
                </div>

                <p className='mt-5 text-sm leading-relaxed text-(--text-sub)'>
                    {plan.description}
                </p>

                <ul className='mb-8 mt-6 space-y-3 border-t border-(--border-line) pt-6 text-sm text-(--text-main)'>
                    {plan.features.map((feature) => (
                        <li
                            key={feature}
                            className='flex items-start gap-2.5'>
                            <span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300'>
                                <Check
                                    size={12}
                                    strokeWidth={3}
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
            <main className='mx-auto w-full max-w-6xl px-6 py-16 md:py-20'>
                <div className='animate-fade-up mx-auto mb-14 max-w-3xl text-center'>
                <span className='eyebrow mb-5'>Pricing</span>
                <h1 className='font-display text-5xl font-extrabold tracking-tight text-(--text-main) sm:text-6xl'>
                    Simple plans for{' '}
                    <span className='text-gradient'>candidates & companies</span>
                </h1>
                <p className='mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-(--text-sub)'>
                    Buy access in packs that match your search. Candidates
                    unlock unlimited resumes and cross-round insights, while
                    companies get a verified hiring pipeline.
                </p>
                </div>

                {successMsg && (
                    <div className='mb-8 flex items-center gap-2 rounded-2xl border border-forest/30 bg-forest/10 p-4 text-sm font-medium text-forest dark:text-forest-dark'>
                        <CheckCircle2 size={16} /> {successMsg}
                    </div>
                )}

                {errorMsg && (
                    <div className='mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400'>
                        {errorMsg}
                    </div>
                )}

                <section className='mb-20'>
                    <div className='mb-10 flex flex-wrap items-end justify-between gap-3'>
                        <div>
                            <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300'>
                                <UserRound size={14} /> Candidate Packs
                            </div>
                            <h2 className='font-display text-3xl font-extrabold tracking-tight text-(--text-main) md:text-4xl'>
                                Unlimited access, bought as a pack
                            </h2>
                        </div>
                        {user?.subscriptionTier === 'PRO' && (
                            <span className='rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest dark:text-forest-dark'>
                                ACTIVE PRO PACK
                            </span>
                        )}
                    </div>

                    {user?.subscriptionTier === 'PRO' && (
                        <div className='mb-8 rounded-2xl border border-(--border-line) bg-(--bg-panel) px-4 py-3 text-sm text-(--text-sub)'>
                            Your current pack is active. Choosing another pack
                            adds its duration from your existing expiry date.
                        </div>
                    )}

                    <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
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

                    <div className='mt-8 rounded-2xl border border-(--border-line) bg-(--bg-panel) px-5 py-4 text-sm text-(--text-sub)'>
                        New candidate accounts start free with one active
                        resume and the standard application queue. Pick a pack
                        when you need unlimited resumes and personalized
                        insights.{' '}
                        {!user && (
                            <Link
                                to='/auth?mode=register'
                                className='font-semibold text-brand-600 underline-offset-4 hover:underline dark:text-brand-300'>
                                Create a free account
                            </Link>
                        )}
                    </div>
                </section>

                <section>
                    <div className='mb-10 flex flex-wrap items-end justify-between gap-3'>
                        <div>
                            <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300'>
                                <Building2 size={14} /> Company Plans
                            </div>
                            <h2 className='font-display text-3xl font-extrabold tracking-tight text-(--text-main) md:text-4xl'>
                                A verified pipeline for hiring teams
                            </h2>
                        </div>
                        {user?.subscriptionTier === 'ENTERPRISE' && (
                            <span className='rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest dark:text-forest-dark'>
                                ACTIVE COMPANY PLAN
                            </span>
                        )}
                    </div>

                    {user?.subscriptionTier === 'ENTERPRISE' && (
                        <div className='mb-8 rounded-2xl border border-(--border-line) bg-(--bg-panel) px-4 py-3 text-sm text-(--text-sub)'>
                            Your company plan is active. Choosing another plan
                            adds its duration from your existing expiry date.
                        </div>
                    )}

                    <div className='mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2'>
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

                    <div className='mt-8 rounded-2xl border border-(--border-line) bg-(--bg-panel) px-5 py-4 text-sm text-(--text-sub)'>
                        Company plans require a recruiter account. Register as
                        a hiring team to activate a monthly or annual plan.
                    </div>
                </section>
            </main>

            <SiteFooter tagline='All plans billed in DZD · Packs activate immediately' />
        </div>
    );
}
