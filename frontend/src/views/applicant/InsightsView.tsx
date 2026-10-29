import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import { Lock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InsightsView() {
    const user = useAuthStore((state) => state.user);

    const { data: insightsData, error } = useQuery({
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
            <div className='page-scroll flex flex-col justify-center items-center px-6 py-20 text-center'>
                <div className='p-3 rounded-full bg-(--bg-panel) border border-(--border-line) mb-4 text-(--text-main)'>
                    <Lock size={24} />
                </div>
                <h2 className='font-grotesque font-bold text-4xl text-(--text-main) mb-2'>
                    Personalized Insights is a Pro Feature
                </h2>
                <p className='text-sm text-(--text-sub) max-w-md mb-6 leading-relaxed'>
                    Upgrade to Pro to unlock cross-round telemetry: find out
                    which missing criteria appear most frequently in your
                    rejections, see how you benchmark across departments, and
                    get targeted learning milestones.
                </p>
                <Link
                    to='/pricing'
                    className='px-6 py-2.5 bg-(--btn-main-bg) text-(--btn-main-text) font-grotesque font-bold text-xl rounded-md hover:opacity-90 transition-opacity'>
                    Upgrade to Pro from 999 DZD
                </Link>
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
