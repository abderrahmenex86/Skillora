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
            className={`flex flex-col justify-between rounded-lg p-5 tall:p-6 bg-(--bg-canvas) ${
                plan.recommended ?
                    'border-2 border-(--text-main) shadow-xs'
                :   'border border-(--border-line)'
            }`}>
            <div>
                <div className='flex items-start justify-between gap-3'>
                    <span className='font-mono text-xs text-(--text-sub) uppercase'>
                        {plan.label}
                    </span>
                    <div className='flex flex-wrap justify-end gap-1.5'>
                        {plan.recommended && (
                            <span className='font-mono text-[10px] px-2 py-0.5 rounded bg-(--bg-panel) text-(--text-main)'>
                                RECOMMENDED
                            </span>
                        )}
                        {plan.savingsPercent > 0 && (
                            <span className='font-mono text-[10px] px-2 py-0.5 rounded border border-forest/30 bg-forest/5 text-forest dark:text-forest-dark'>
                                SAVE {plan.savingsPercent}%
                            </span>
                        )}
                    </div>
                </div>

                <div className='font-grotesque font-extrabold text-4xl text-(--text-main) my-3 tall:my-4'>
                    {formatDzd(plan.price)}
                </div>
                <div className='text-xs text-(--text-sub) mb-4'>
                    {plan.months === 1 ?
                        'Billed monthly'
                    :   `Billed every ${plan.months} months`}
                    {plan.months > 1 && (
                        <> · {formatDzd(plan.monthlyPrice)}/mo</>
                    )}
                </div>

                <p className='text-xs text-(--text-sub) mb-4 tall:mb-6'>
                    {plan.description}
                </p>

                <ul className='space-y-2.5 tall:space-y-3 text-xs text-(--text-main) font-mono mb-5 tall:mb-8'>
                    {plan.features.map((feature) => (
                        <li
                            key={feature}
                            className='flex items-start gap-2'>
                            <Check
                                size={14}
                                className='mt-0.5 shrink-0'
                            />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>

            <button
                type='button'
                onClick={onSelect}
                disabled={disabled || loading}
                className={`w-full py-2.5 text-center text-xs font-mono uppercase tracking-wider font-semibold rounded-md transition-opacity disabled:cursor-not-allowed ${
                    disabled ?
                        'border border-(--border-line) text-(--text-sub)'
                    : plan.recommended ?
                        'bg-(--btn-main-bg) text-(--btn-main-text) hover:opacity-90 disabled:opacity-50'
                    :   'border border-(--border-line) text-(--text-main) hover:bg-(--bg-panel) disabled:opacity-50'
                }`}>
                <span className='inline-flex items-center justify-center gap-2'>
                    {loading && (
                        <Loader2
                            size={14}
                            className='animate-spin'
                        />
                    )}
                    {loading ? 'Activating...' : ctaLabel}
                </span>
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
        <div className='flex-1 flex flex-col justify-between'>
            <main className='max-w-6xl mx-auto px-6 pt-8 pb-4 tall:py-16 w-full'>
                <h1 className='font-grotesque font-extrabold text-5xl sm:text-6xl text-(--text-main) tracking-tight mb-4'>
                    Candidate packs and company plans
                </h1>
                <p className='text-lg text-(--text-sub) max-w-2xl leading-relaxed mb-6 tall:mb-10'>
                    Buy access in packs that match your search. Candidates
                    unlock unlimited resumes and cross-round insights, while
                    companies get a verified hiring pipeline.
                </p>

                {successMsg && (
                    <div className='mb-6 p-4 border border-forest/40 bg-forest/5 text-forest dark:text-forest-dark rounded-md text-xs font-mono flex items-center gap-2'>
                        <CheckCircle2 size={16} /> {successMsg}
                    </div>
                )}

                {errorMsg && (
                    <div className='mb-6 p-4 border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 rounded-md text-xs font-mono'>
                        {errorMsg}
                    </div>
                )}

                <section className='mb-10 tall:mb-14'>
                    <div className='flex flex-wrap items-end justify-between gap-3 mb-5'>
                        <div>
                            <div className='flex items-center gap-2 font-mono text-xs text-(--text-sub) uppercase mb-1'>
                                <UserRound size={14} /> Candidate Packs
                            </div>
                            <h2 className='font-grotesque font-extrabold text-3xl text-(--text-main) tracking-tight'>
                                Unlimited access, bought as a pack
                            </h2>
                        </div>
                        {user?.subscriptionTier === 'PRO' && (
                            <span className='font-mono text-[10px] px-2 py-1 rounded border border-forest/30 bg-forest/5 text-forest dark:text-forest-dark'>
                                ACTIVE PRO PACK
                            </span>
                        )}
                    </div>

                    {user?.subscriptionTier === 'PRO' && (
                        <div className='mb-5 rounded border border-(--border-line) bg-(--bg-panel) px-3 py-2 text-xs text-(--text-sub)'>
                            Your current pack is active. Choosing another pack
                            adds its duration from your existing expiry date.
                        </div>
                    )}

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 tall:gap-8'>
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

                    <div className='mt-4 rounded border border-(--border-line) bg-(--bg-panel) px-4 py-3 text-xs text-(--text-sub)'>
                        New candidate accounts start free with one active
                        resume and the standard application queue. Pick a pack
                        when you need unlimited resumes and personalized
                        insights.{' '}
                        {!user && (
                            <Link
                                to='/auth?mode=register'
                                className='font-medium text-(--text-main) underline'>
                                Create a free account
                            </Link>
                        )}
                    </div>
                </section>

                <section className='mb-6 tall:mb-16'>
                    <div className='flex flex-wrap items-end justify-between gap-3 mb-5'>
                        <div>
                            <div className='flex items-center gap-2 font-mono text-xs text-(--text-sub) uppercase mb-1'>
                                <Building2 size={14} /> Company Plans
                            </div>
                            <h2 className='font-grotesque font-extrabold text-3xl text-(--text-main) tracking-tight'>
                                A verified pipeline for hiring teams
                            </h2>
                        </div>
                        {user?.subscriptionTier === 'ENTERPRISE' && (
                            <span className='font-mono text-[10px] px-2 py-1 rounded border border-forest/30 bg-forest/5 text-forest dark:text-forest-dark'>
                                ACTIVE COMPANY PLAN
                            </span>
                        )}
                    </div>

                    {user?.subscriptionTier === 'ENTERPRISE' && (
                        <div className='mb-5 rounded border border-(--border-line) bg-(--bg-panel) px-3 py-2 text-xs text-(--text-sub)'>
                            Your company plan is active. Choosing another plan
                            adds its duration from your existing expiry date.
                        </div>
                    )}

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 tall:gap-8'>
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

                    <div className='mt-4 rounded border border-(--border-line) bg-(--bg-panel) px-4 py-3 text-xs text-(--text-sub)'>
                        Company plans require a recruiter account. Register as
                        a hiring team to activate a monthly or annual plan.
                    </div>
                </section>
            </main>

            <footer className='border-t border-(--border-line) py-3 tall:py-6 px-6 text-xs font-mono text-(--text-sub) max-w-7xl mx-auto w-full text-center'>
                All plans billed in Algerian Dinars (DZD) • Packs activate
                immediately
            </footer>
        </div>
    );
}
