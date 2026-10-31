import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import { Lock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InsightsView() {
    const user = useAuthStore((state) => state.user);

    const { data: insightsData } = useQuery({
        queryKey: ['pro-insights'],
        queryFn: async () => {
            const { data } = await apiClient.get('/applicant/insights');
            return data.insights;
        },
        enabled:
            user?.subscriptionTier === 'PRO' ||
            user?.subscriptionTier === 'ENTERPRISE',
        retry: false,
    });

    if (user?.subscriptionTier === 'FREE') {
        return (
            <div className='page-scroll px-6 py-12'>
                <div className='mx-auto w-full max-w-3xl'>
                    <div className='flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-(--text-sub)'>
                        <Lock
                            size={13}
                            aria-hidden='true'
                        />
                        Pro insights
                    </div>
                    <h2 className='mt-3 font-grotesque text-4xl font-bold tracking-tight text-(--text-main)'>
                        See the pattern behind your rejections.
                    </h2>
                    <p className='mt-2 max-w-2xl text-sm leading-relaxed text-(--text-sub)'>
                        Personalized Insights turns your application history
                        into cross-round telemetry: the gaps that repeat, how
                        you compare with your cohort, and the next milestone
                        worth shipping.
                    </p>

                    <div className='mt-8 rounded-lg border border-(--border-line) bg-(--bg-canvas) p-5'>
                        <div className='flex flex-wrap items-center justify-between gap-2'>
                            <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-(--text-main)'>
                                Example preview
                            </span>
                            <span className='font-mono text-[9px] uppercase tracking-[0.12em] text-(--text-sub)'>
                                Sample data
                            </span>
                        </div>

                        <div className='mt-4 grid gap-3 md:grid-cols-3'>
                            <div className='rounded-md border border-(--border-line) bg-(--bg-panel) p-4'>
                                <AlertTriangle
                                    size={16}
                                    className='text-amber-accent'
                                    aria-hidden='true'
                                />
                                <div className='mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-(--text-sub)'>
                                    Most common gap
                                </div>
                                <div className='mt-1 font-grotesque text-2xl font-bold text-(--text-main)'>
                                    Kubernetes
                                </div>
                                <p className='mt-1 text-[11px] leading-relaxed text-(--text-sub)'>
                                    Missing in 3 of your last 5 rejections.
                                </p>
                            </div>
                            <div className='rounded-md border border-(--border-line) bg-(--bg-panel) p-4'>
                                <TrendingUp
                                    size={16}
                                    className='text-forest dark:text-forest-dark'
                                    aria-hidden='true'
                                />
                                <div className='mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-(--text-sub)'>
                                    Match benchmark
                                </div>
                                <div className='mt-1 font-grotesque text-2xl font-bold text-(--text-main)'>
                                    72%
                                </div>
                                <p className='mt-1 text-[11px] leading-relaxed text-(--text-sub)'>
                                    8 points above the cohort median.
                                </p>
                            </div>
                            <div className='rounded-md border border-(--border-line) bg-(--bg-panel) p-4'>
                                <CheckCircle
                                    size={16}
                                    className='text-forest dark:text-forest-dark'
                                    aria-hidden='true'
                                />
                                <div className='mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-(--text-sub)'>
                                    Next milestone
                                </div>
                                <div className='mt-1 font-grotesque text-2xl font-bold text-(--text-main)'>
                                    Helm deployment
                                </div>
                                <p className='mt-1 text-[11px] leading-relaxed text-(--text-sub)'>
                                    Ship one verified artifact to close the
                                    gap.
                                </p>
                            </div>
                        </div>

                        <div className='mt-4 rounded-md border border-dashed border-(--border-line) px-4 py-3 text-xs text-(--text-sub)'>
                            Unlock your real cross-round telemetry, department
                            benchmarks, and targeted learning milestones.
                        </div>
                    </div>

                    <div className='mt-6 flex flex-wrap items-center gap-4'>
                        <Link
                            to='/pricing'
                            className='inline-flex rounded-md bg-(--btn-main-bg) px-6 py-2.5 font-grotesque text-xl font-bold text-(--btn-main-text) transition-opacity hover:opacity-90'>
                            Upgrade to Pro from 999 DZD
                        </Link>
                        <span className='font-mono text-[10px] uppercase tracking-[0.12em] text-(--text-sub)'>
                            Cancel anytime · Test mode
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-5 overflow-y-auto mx-auto px-6 py-6 lg:overflow-hidden'>
            <div className='shrink-0 border-b border-(--border-line) pb-4'>
                <h1 className='font-grotesque font-extrabold text-4xl text-(--text-main) tracking-tight'>
                    Personalized Career Insights
                </h1>
            </div>

            <div className='grid shrink-0 grid-cols-1 gap-4 md:grid-cols-3'>
                <div className='p-5 border border-(--border-line) rounded-md bg-(--bg-canvas)'>
                    <div className='font-mono text-xs text-(--text-sub) uppercase mb-1'>
                        Total Cohorts
                    </div>
                    <div className='font-grotesque font-extrabold text-4xl text-(--text-main)'>
                        {insightsData?.totalEvaluations ?? 0}
                    </div>
                </div>
                <div className='p-5 border border-(--border-line) rounded-md bg-(--bg-canvas)'>
                    <div className='font-mono text-xs text-(--text-sub) uppercase mb-1'>
                        Average Match Score
                    </div>
                    <div className='font-grotesque font-extrabold text-4xl text-(--text-main)'>
                        {insightsData?.averageMatchScore ?? 0}%
                    </div>
                </div>
                <div className='p-5 border border-(--border-line) rounded-md bg-(--bg-canvas)'>
                    <div className='font-mono text-xs text-(--text-sub) uppercase mb-1'>
                        Top Sector Conversion
                    </div>
                    <div className='font-grotesque font-bold text-2xl text-forest dark:text-forest-dark mt-2'>
                        Verified Artifacts
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 gap-6 md:min-h-0 md:flex-1 md:grid-cols-12 md:items-stretch'>
                <section className='flex min-h-0 flex-col rounded-lg border border-(--border-line) bg-(--bg-canvas) md:col-span-7'>
                    <h3 className='shrink-0 border-b border-(--border-line) px-6 py-4 font-grotesque font-bold text-2xl text-(--text-main)'>
                        Recurrent Unmet Criteria
                    </h3>
                    <div className='panel-scroll panel-snap flex-1 space-y-4 p-6'>
                    <p className='text-xs text-(--text-sub)'>
                        These criteria appeared most frequently in your
                        rejection dossiers across all cohorts:
                    </p>

                    <div className='space-y-3'>
                        {insightsData?.recurrentGaps?.map(
                            (gap: any, i: number) => (
                                <div
                                    key={i}
                                    className='relative p-3 border border-(--border-line) rounded flex items-center justify-between text-xs'>
                                    <span
                                        aria-hidden='true'
                                        className='snap-anchor'
                                    />
                                    <span className='font-medium text-(--text-main)'>
                                        {gap.skill}
                                    </span>
                                    <span className='font-mono text-amber-accent font-semibold'>
                                        Missing in {gap.impactPercentage}% of
                                        cohorts
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                    </div>
                </section>

                <section className='flex min-h-0 flex-col rounded-lg border border-(--border-line) bg-(--bg-canvas) md:col-span-5'>
                    <h3 className='shrink-0 border-b border-(--border-line) px-6 py-4 font-grotesque font-bold text-2xl text-(--text-main)'>
                        Targeted Recommendations
                    </h3>
                    <div className='panel-scroll panel-snap flex-1 space-y-2 p-6'>
                        {insightsData?.recommendations?.map(
                            (rec: string, i: number) => (
                                <div
                                    key={i}
                                    className='relative text-xs text-(--text-sub) p-3 bg-(--bg-panel) rounded'>
                                    <span
                                        aria-hidden='true'
                                        className='snap-anchor'
                                    />
                                    • {rec}
                                </div>
                            )
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
