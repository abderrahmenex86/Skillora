import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/apiClient';
import { Check, CheckCircle2 } from 'lucide-react';

export default function PricingView() {
    const { user, setTokens, accessToken } = useAuthStore();
    const navigate = useNavigate();
    const [upgrading, setUpgrading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handleUpgrade = async () => {
        if (!user) {
            navigate('/auth?mode=register');
            return;
        }

        setUpgrading(true);
        try {
            const { data } = await apiClient.post('/applicant/upgrade-pro');
            if (accessToken) {
                setTokens(accessToken, data.user);
            }
            setSuccessMsg(
                'Successfully upgraded to Pro! You now have unlimited profiles & insights.'
            );
            setTimeout(() => navigate('/applicant/insights'), 1500);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Upgrade failed');
        } finally {
            setUpgrading(false);
        }
    };

    return (
        <div className='flex-1 flex flex-col justify-between'>
            <main className='max-w-6xl mx-auto px-6 py-16 w-full'>
                <h1 className='font-grotesque font-extrabold text-5xl sm:text-6xl text-(--text-main) tracking-tight mb-4'>
                    Plans for Applicants and Employers
                </h1>
                <p className='text-lg text-(--text-sub) max-w-2xl leading-relaxed mb-10'>
                    Affordable subscription tiers for candidates to unlock
                    multiple profiles and cross-round insights, alongside
                    verified pipeline plans for hiring teams.
                </p>

                {successMsg && (
                    <div className='mb-8 p-4 border border-forest/40 bg-forest/5 text-forest dark:text-forest-dark rounded-md text-xs font-mono flex items-center gap-2'>
                        <CheckCircle2 size={16} /> {successMsg}
                    </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-16'>
                    {/* Candidate Free */}
                    <div className='border border-(--border-line) rounded-lg p-6 bg-(--bg-canvas) flex flex-col justify-between'>
                        <div>
                            <span className='font-mono text-xs text-(--text-sub) uppercase'>
                                Candidate Free
                            </span>
                            <div className='font-grotesque font-extrabold text-4xl text-(--text-main) my-4'>
                                0 DZD{' '}
                                <span className='text-sm font-sans font-normal text-(--text-sub)'>
                                    / mo
                                </span>
                            </div>
                            <p className='text-xs text-(--text-sub) mb-6'>
                                For candidates starting their job hunt with a
                                single focused profile.
                            </p>
                            <ul className='space-y-3 text-xs text-(--text-main) font-mono mb-8'>
                                <li className='flex items-center gap-2'>
                                    <Check size={14} /> Exactly 1 Active Profile
                                </li>
                                <li className='flex items-center gap-2'>
                                    <Check size={14} /> Standard application
                                    queue
                                </li>
                                <li className='flex items-center gap-2'>
                                    <Check size={14} /> Guaranteed Actionable
                                    Gap Analysis
                                </li>
                                <li className='flex items-center gap-2'>
                                    <Check size={14} /> Interview Calendar
                                    integration
                                </li>
                            </ul>
                        </div>
                        {user?.role === 'APPLICANT' ?
                            <div className='text-center text-xs font-mono text-(--text-sub) py-2.5 border border-(--border-line) rounded'>
                                Current Plan
                            </div>
                        :   <Link
                                to='/auth?mode=register'
                                className='w-full py-2.5 text-center text-xs font-mono uppercase tracking-wider font-semibold border border-(--border-line) rounded-md text-(--text-main) hover:bg-(--bg-panel)'>
                                Get Started Free
                            </Link>
                        }
                    </div>

                    {/* Candidate Pro */}
                    <div className='border-2 border-(--text-main) rounded-lg p-6 bg-(--bg-canvas) flex flex-col justify-between shadow-xs'>
                        <div>
                            <div className='flex justify-between items-center'>
                                <span className='font-mono text-xs text-(--text-sub) uppercase'>
                                    Candidate Pro
                                </span>
                                <span className='font-mono text-[10px] px-2 py-0.5 rounded bg-(--bg-panel) text-(--text-main)'>
                                    RECOMMENDED
                                </span>
                            </div>
                            <div className='font-grotesque font-extrabold text-4xl text-(--text-main) my-4'>
                                1,200 DZD{' '}
                                <span className='text-sm font-sans font-normal text-(--text-sub)'>
                                    / mo
                                </span>
                            </div>
                            <p className='text-xs text-(--text-sub) mb-6'>
                                For multi-disciplinary candidates applying
                                across multiple domains.
                            </p>
                            <ul className='space-y-3 text-xs text-(--text-main) font-mono mb-8'>
                                <li className='flex items-center gap-2'>
                                    <Check size={14} /> Unlimited Active
                                    Profiles (Tech, Law, etc.)
                                </li>
                                <li className='flex items-center gap-2'>
                                    <Check size={14} /> Unlimited monthly
                                    applications
                                </li>
                                <li className='flex items-center gap-2'>
                                    <Check size={14} /> Personalized Cross-Round
                                    Insights
                                </li>
                                <li className='flex items-center gap-2'>
                                    <Check size={14} /> Priority scheduling
                                    agent routing
                                </li>
                            </ul>
                        </div>

                        {user?.subscriptionTier === 'PRO' ?
                            <div className='text-center text-xs font-mono text-forest dark:text-forest-dark font-semibold py-2.5 border border-forest/30 bg-forest/5 rounded'>
                                Active Pro Subscription ✓
                            </div>
                        :   <button
                                type='button'
                                onClick={handleUpgrade}
                                disabled={upgrading}
                                className='w-full py-2.5 text-center text-xs font-mono uppercase tracking-wider font-semibold rounded-md bg-(--btn-main-bg) text-(--btn-main-text) hover:opacity-90 disabled:opacity-50'>
                                {upgrading ?
                                    'Upgrading...'
                                :   'Upgrade to Pro (1,200 DZD)'}
                            </button>
                        }
                    </div>

                    {/* Recruiter Pipeline */}
                    <div className='border border-(--border-line) rounded-lg p-6 bg-(--bg-canvas) flex flex-col justify-between'>
                        <div>
                            <span className='font-mono text-xs text-(--text-sub) uppercase'>
                                Recruiter Pipeline
                            </span>
                            <div className='font-grotesque font-extrabold text-4xl text-(--text-main) my-4'>
                                35,000 DZD{' '}
                                <span className='text-sm font-sans font-normal text-(--text-sub)'>
                                    / role
                                </span>
                            </div>
                            <p className='text-xs text-(--text-sub) mb-6'>
                                First opening free. Autonomous rubric checking
                                and interview agent included.
                            </p>
                            <ul className='space-y-3 text-xs text-(--text-main) font-mono mb-8'>
                                <li className='flex items-center gap-2'>
                                    <Check size={14} /> Pre-deadline manual
                                    decision override
                                </li>
                                <li className='flex items-center gap-2'>
                                    <Check size={14} /> Autonomous document &
                                    repo parsing
                                </li>
                                <li className='flex items-center gap-2'>
                                    <Check size={14} /> Autonomous Calendar
                                    dispatch
                                </li>
                                <li className='flex items-center gap-2'>
                                    <Check size={14} /> Automated respectful gap
                                    analysis
                                </li>
                            </ul>
                        </div>
                        <Link
                            to='/auth?mode=register'
                            className='w-full py-2.5 text-center text-xs font-mono uppercase tracking-wider font-semibold border border-(--border-line) rounded-md text-(--text-main) hover:bg-(--bg-panel)'>
                            Post Employer Role
                        </Link>
                    </div>
                </div>
            </main>

            <footer className='border-t border-(--border-line) py-6 px-6 text-xs font-mono text-(--text-sub) max-w-7xl mx-auto w-full text-center'>
                All plans billed in Algerian Dinars (DZD) • Cancel anytime
            </footer>
        </div>
    );
}
