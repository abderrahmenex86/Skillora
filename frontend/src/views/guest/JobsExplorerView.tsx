import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import { Search, ArrowRight, Check, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function JobsExplorerView() {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);

    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [appliedSuccess, setAppliedSuccess] = useState(false);
    const [applyError, setApplyError] = useState('');

    const { data: positions, isLoading } = useQuery({
        queryKey: ['public-positions'],
        queryFn: async () => {
            const { data } = await apiClient.get('/public/positions');
            return data.positions;
        },
    });

    const { data: profiles } = useQuery({
        queryKey: ['applicant-profiles'],
        queryFn: async () => {
            const { data } = await apiClient.get('/applicant/profiles');
            return data.profiles;
        },
        enabled: user?.role === 'APPLICANT',
    });

    const applyMutation = useMutation({
        mutationFn: async ({
            positionId,
            profileId,
        }: {
            positionId: string;
            profileId: string;
        }) => {
            const { data } = await apiClient.post('/applicant/applications', {
                positionId,
                profileId,
            });
            return data.application;
        },
        onSuccess: () => {
            setAppliedSuccess(true);
            setApplyError('');
            queryClient.invalidateQueries({ queryKey: ['my-applications'] });
        },
        onError: (err: any) => {
            setApplyError(
                err.response?.data?.error || 'Failed to submit application'
            );
        },
    });

    const selectedJob =
        positions?.find(
            (j: any) => j.id === (selectedJobId || positions[0]?.id)
        ) || positions?.[0];

    const handleApply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJob || !selectedProfileId) return;
        applyMutation.mutate({
            positionId: selectedJob.id,
            profileId: selectedProfileId,
        });
    };

    return (
        <div className='flex-1 max-w-7xl w-full mx-auto px-6 py-8'>
            <div className='mb-8 border-b border-(--border-line) pb-6'>
                <h1 className='font-grotesque font-extrabold text-4xl text-(--text-main) tracking-tight'>
                    Explore Open Roles
                </h1>
                <p className='text-sm text-(--text-sub) mt-1'>
                    Every role guarantees either an interview or an actionable
                    growth roadmap.
                </p>
            </div>

            {isLoading ?
                <div className='text-xs text-(--text-sub)'>
                    Loading openings...
                </div>
            : positions?.length === 0 ?
                <div className='p-8 border border-dashed border-(--border-line) text-center text-xs text-(--text-sub) rounded'>
                    No active positions found. Check back soon.
                </div>
            :   <div className='grid grid-cols-1 md:grid-cols-12 gap-8 items-start'>
                    <div className='md:col-span-5 space-y-3'>
                        <h3 className='font-grotesque font-bold text-2xl text-(--text-main) mb-2'>
                            Available Openings ({positions?.length ?? 0})
                        </h3>
                        {positions?.map((job: any) => {
                            const isSelected =
                                (selectedJobId || positions[0]?.id) === job.id;
                            return (
                                <div
                                    key={job.id}
                                    onClick={() => {
                                        setSelectedJobId(job.id);
                                        setAppliedSuccess(false);
                                        setApplyError('');
                                    }}
                                    className={`p-5 rounded-md border cursor-pointer transition-all ${
                                        isSelected ?
                                            'border-(--text-main) bg-(--bg-canvas) ring-1 ring-(--text-main)'
                                        :   'border-(--border-line) bg-(--bg-canvas) hover:border-(--text-sub)'
                                    }`}>
                                    <div className='flex justify-between items-start mb-2'>
                                        <div>
                                            <h4 className='font-grotesque font-bold text-2xl text-(--text-main) leading-tight'>
                                                {job.title}
                                            </h4>
                                            <p className='text-xs text-(--text-sub)'>
                                                {job.companyName} •{' '}
                                                {job.location}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <ArrowRight
                                                size={18}
                                                className='text-(--text-main)'
                                            />
                                        )}
                                    </div>

                                    <div className='mt-3 flex items-center justify-between text-xs font-mono text-(--text-sub)'>
                                        <span>{job.department}</span>
                                        <span className='text-amber-accent'>
                                            Closes:{' '}
                                            {new Date(
                                                job.deadline
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className='md:col-span-7 border border-(--border-line) rounded-lg p-8 bg-(--bg-canvas) space-y-6'>
                        {selectedJob && (
                            <>
                                <div>
                                    <h2 className='font-grotesque font-extrabold text-3xl md:text-4xl text-(--text-main) tracking-tight mb-1'>
                                        {selectedJob.title}
                                    </h2>
                                    <p className='text-sm text-(--text-sub)'>
                                        {selectedJob.companyName} •{' '}
                                        {selectedJob.location} •{' '}
                                        {selectedJob.department}
                                    </p>
                                </div>

                                <div className='border-t border-(--border-line) pt-4'>
                                    <span className='font-mono text-xs text-(--text-sub) uppercase tracking-wider block mb-2'>
                                        MANDATORY RUBRIC CRITERIA
                                    </span>
                                    <div className='space-y-1.5'>
                                        {selectedJob.rubric?.mandatoryCriteria?.map(
                                            (crit: string, i: number) => (
                                                <div
                                                    key={i}
                                                    className='p-3 bg-(--bg-panel) border border-(--border-line) rounded text-xs text-(--text-main) font-mono'>
                                                    • {crit}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className='pt-4'>
                                    {!user ?
                                        <div className='p-4 border border-(--border-line) rounded-md bg-(--bg-panel) text-center space-y-3'>
                                            <div className='flex items-center justify-center gap-2 text-xs text-(--text-sub)'>
                                                <Lock size={14} /> Log in to
                                                apply with your verified profile
                                            </div>
                                            <Link
                                                to='/auth?mode=login'
                                                className='inline-block px-6 py-2.5 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-mono uppercase tracking-wider rounded font-semibold hover:opacity-90'>
                                                Log In to Apply
                                            </Link>
                                        </div>
                                    : user.role === 'RECRUITER' ?
                                        <div className='text-xs text-(--text-sub) p-3 bg-(--bg-panel) rounded'>
                                            Logged in as Recruiter. Switch to
                                            Candidate account to submit
                                            applications.
                                        </div>
                                    : appliedSuccess ?
                                        <div className='p-4 border border-forest/30 bg-forest/5 text-forest dark:text-forest-dark rounded-md text-xs font-mono flex items-center justify-center gap-2 font-semibold'>
                                            <Check size={16} /> Application
                                            Submitted — Evaluation in Progress
                                        </div>
                                    :   <div>
                                            <button
                                                onClick={() =>
                                                    setApplyModalOpen(true)
                                                }
                                                className='w-full py-3.5 bg-(--btn-main-bg) text-(--btn-main-text) font-grotesque font-bold text-xl rounded-md hover:opacity-90 transition-opacity'>
                                                Apply with Candidate Profile
                                            </button>
                                        </div>
                                    }
                                </div>
                            </>
                        )}
                    </div>
                </div>
            }

            {applyModalOpen && (
                <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
                    <div className='bg-(--bg-canvas) border border-(--border-line) rounded-lg p-6 max-w-md w-full space-y-4'>
                        <h3 className='font-grotesque font-bold text-2xl text-(--text-main)'>
                            Select Profile for this Role
                        </h3>

                        {applyError && (
                            <div className='p-2 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded'>
                                {applyError}
                            </div>
                        )}

                        {profiles?.length === 0 ?
                            <div className='text-xs text-(--text-sub) space-y-3'>
                                <p>
                                    You haven't created any candidate profiles
                                    yet.
                                </p>
                                <Link
                                    to='/applicant/profiles'
                                    className='inline-block px-4 py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-xs rounded'>
                                    Create Profile First
                                </Link>
                            </div>
                        :   <form
                                onSubmit={handleApply}
                                className='space-y-4'>
                                <label className='block text-xs text-(--text-sub)'>
                                    Which profile best matches this opening?
                                </label>
                                <select
                                    required
                                    value={selectedProfileId}
                                    onChange={(e) =>
                                        setSelectedProfileId(e.target.value)
                                    }
                                    className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main)'>
                                    <option value=''>
                                        -- Choose Profile --
                                    </option>
                                    {profiles?.map((p: any) => (
                                        <option
                                            key={p.id}
                                            value={p.id}>
                                            {p.title}
                                        </option>
                                    ))}
                                </select>

                                <div className='flex justify-end gap-2 pt-2'>
                                    <button
                                        type='button'
                                        onClick={() => setApplyModalOpen(false)}
                                        className='px-4 py-2 border border-(--border-line) text-xs font-semibold rounded'>
                                        Cancel
                                    </button>
                                    <button
                                        type='submit'
                                        disabled={
                                            applyMutation.isPending ||
                                            !selectedProfileId
                                        }
                                        className='px-4 py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-semibold rounded hover:opacity-90 disabled:opacity-50'>
                                        Submit Application
                                    </button>
                                </div>
                            </form>
                        }
                    </div>
                </div>
            )}
        </div>
    );
}
