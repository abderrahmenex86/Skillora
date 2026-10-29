import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import { Search, ArrowRight, Check, Lock, Loader2 } from 'lucide-react';
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

    const { data: profiles, isLoading: profilesLoading } = useQuery({
        queryKey: ['applicant-profiles'],
        queryFn: async () => {
            const { data } = await apiClient.get('/applicant/profiles');
            return data.profiles;
        },
        enabled: user?.role === 'APPLICANT',
    });

    const { data: myApplications } = useQuery({
        queryKey: ['my-applications'],
        queryFn: async () => {
            const { data } = await apiClient.get('/applicant/applications');
            return data.applications;
        },
        enabled: user?.role === 'APPLICANT',
    });

    const appliedPositionIds = new Set<string>(
        (myApplications ?? [])
            .map(
                (application: any) =>
                    application.positionId ?? application.position?.id
            )
            .filter(Boolean)
    );

    const applyMutation = useMutation({
        mutationFn: async ({
            positionId,
            profileId,
        }: {
            positionId: string;
            profileId: string;
        }) => {
            const { data } = await apiClient.post(
                '/applicant/applications',
                {
                    positionId,
                    profileId,
                },
                { timeout: 20000 }
            );
            return data.application;
        },
        onSuccess: () => {
            setAppliedSuccess(true);
            setApplyError('');
            setApplyModalOpen(false);
            setSelectedProfileId('');
            queryClient.invalidateQueries({ queryKey: ['my-applications'] });
        },
        onError: (err: any) => {
            if (err.code === 'ECONNABORTED') {
                setApplyError(
                    'The request timed out. Refresh the page to check whether your application was recorded before retrying.'
                );
                queryClient.invalidateQueries({
                    queryKey: ['my-applications'],
                });
                return;
            }

            setApplyError(
                err.response?.data?.error || 'Failed to submit application'
            );
        },
    });

    const selectedJob =
        positions?.find(
            (j: any) => j.id === (selectedJobId || positions[0]?.id)
        ) || positions?.[0];

    const selectedJobHasApplied = Boolean(
        selectedJob && appliedPositionIds.has(selectedJob.id)
    );

    const handleApply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJob || !selectedProfileId || applyMutation.isPending)
            return;
        applyMutation.mutate({
            positionId: selectedJob.id,
            profileId: selectedProfileId,
        });
    };

    return (
        <div className='flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-5 overflow-y-auto mx-auto px-6 py-6 md:overflow-hidden'>
            <div className='shrink-0 border-b border-(--border-line) pb-4'>
                <h1 className='font-grotesque font-extrabold text-4xl text-(--text-main) tracking-tight'>
                    Jobs
                </h1>
            </div>

            {isLoading ?
                <div className='flex items-center gap-2 text-xs text-(--text-sub)'>
                    <Loader2 size={14} className='animate-spin' />
                    Loading jobs...
                </div>
            : positions?.length === 0 ?
                <div className='p-8 border border-dashed border-(--border-line) text-center rounded-lg'>
                    <Search
                        size={48}
                        strokeWidth={1.25}
                        className='mx-auto text-(--text-sub)'
                        aria-hidden='true'
                    />
                    <div className='mt-4 text-sm font-medium text-(--text-main)'>
                        No active jobs found
                    </div>
                    <p className='mt-1 text-xs text-(--text-sub)'>
                        Check back soon. New roles are added regularly.
                    </p>
                </div>
            :   <div className='grid grid-cols-1 gap-6 md:min-h-0 md:flex-1 md:grid-cols-12 md:items-stretch'>
                    <div className='flex flex-col gap-3 md:col-span-5 md:min-h-0'>
                        <h3 className='shrink-0 font-grotesque font-bold text-2xl text-(--text-main)'>
                            Available Jobs ({positions?.length ?? 0})
                        </h3>
                        <div className='panel-scroll panel-snap flex-1 space-y-3 md:pr-1'>
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
                                    className={`relative p-5 rounded-md border cursor-pointer transition-all ${
                                        isSelected ?
                                            'border-(--text-main) bg-(--bg-canvas) ring-1 ring-(--text-main)'
                                        :   'border-(--border-line) bg-(--bg-canvas) hover:border-(--text-sub)'
                                    }`}>
                                    <span
                                        aria-hidden='true'
                                        className='snap-anchor'
                                    />
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
                                        <div className='flex items-center gap-2'>
                                            <span>{job.department}</span>
                                            {appliedPositionIds.has(job.id) && (
                                                <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-forest/10 text-forest dark:text-forest-dark'>
                                                    <Check size={10} />
                                                    Applied
                                                </span>
                                            )}
                                        </div>
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
                    </div>

                    <div className='panel-scroll rounded-lg border border-(--border-line) bg-(--bg-canvas) p-6 space-y-6 md:col-span-7 md:p-8'>
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
                                                apply with a tailored resume
                                            </div>
                                            <Link
                                                to='/auth?mode=login'
                                                className='inline-block px-6 py-2.5 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-mono uppercase tracking-wider rounded font-semibold hover:opacity-90'>
                                                Log In to Apply
                                            </Link>
                                        </div>
                                    : user.role === 'RECRUITER' ?
                                        <div className='text-xs text-(--text-sub) p-3 bg-(--bg-panel) rounded'>
                                            Logged in as Recruiter. Switch to an
                                            applicant account to submit
                                            applications.
                                        </div>
                                    : selectedJobHasApplied || appliedSuccess ?
                                        <div className='p-4 border border-forest/30 bg-forest/5 text-forest dark:text-forest-dark rounded-md text-xs font-mono text-center font-semibold space-y-1'>
                                            <div className='flex items-center justify-center gap-2'>
                                                <Check size={16} /> Application
                                                Submitted — Evaluation in
                                                Progress
                                            </div>
                                            <p className='text-[11px] font-normal opacity-80'>
                                                You can still apply to any other
                                                open job.
                                            </p>
                                        </div>
                                    :   <div>
                                            <button
                                                onClick={() => {
                                                    setApplyError('');
                                                    setApplyModalOpen(true);
                                                }}
                                                className='w-full py-3.5 bg-(--btn-main-bg) text-(--btn-main-text) font-grotesque font-bold text-xl rounded-md hover:opacity-90 transition-opacity'>
                                                Apply with a Tailored Resume
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
                <div
                    className='modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
                    onClick={() => {
                        if (!applyMutation.isPending) {
                            setApplyModalOpen(false);
                        }
                    }}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className='modal-panel bg-(--bg-canvas) border border-(--border-line) rounded-lg p-6 max-w-md w-full space-y-4'>
                        <h3 className='font-grotesque font-bold text-2xl text-(--text-main)'>
                            Select a Resume for this Role
                        </h3>

                        {applyError && (
                            <div className='p-2 text-xs bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded'>
                                {applyError}
                            </div>
                        )}

                        {profilesLoading ?
                            <div className='flex items-center gap-2 py-2 text-xs text-(--text-sub)'>
                                <Loader2
                                    size={14}
                                    className='animate-spin'
                                />
                                Loading your resumes...
                            </div>
                        : profiles?.length === 0 ?
                            <div className='text-xs text-(--text-sub) space-y-3'>
                                <p>
                                    You haven't created any tailored resumes
                                    yet.
                                </p>
                                <Link
                                    to='/applicant/profiles'
                                    className='inline-block px-4 py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-xs rounded'>
                                    Create Tailored Resume
                                </Link>
                            </div>
                        :   <form
                                onSubmit={handleApply}
                                className='space-y-4'>
                                <label className='block text-xs text-(--text-sub)'>
                                    Which resume best matches this opening?
                                </label>
                                <select
                                    required
                                    value={selectedProfileId}
                                    disabled={applyMutation.isPending}
                                    onChange={(e) =>
                                        setSelectedProfileId(e.target.value)
                                    }
                                    className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) disabled:opacity-60'>
                                    <option value=''>
                                        -- Choose Resume --
                                    </option>
                                    {profiles?.map((p: any) => (
                                        <option
                                            key={p.id}
                                            value={p.id}>
                                            {p.title}
                                        </option>
                                    ))}
                                </select>

                                <p className='text-[11px] text-(--text-sub)'>
                                    Your resume is anonymized and evaluated
                                    against the rubric as soon as you submit.
                                </p>

                                <div className='flex justify-end gap-2 pt-2'>
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setApplyModalOpen(false)
                                        }
                                        disabled={applyMutation.isPending}
                                        className='px-4 py-2 border border-(--border-line) text-xs font-semibold rounded disabled:opacity-50'>
                                        Cancel
                                    </button>
                                    <button
                                        type='submit'
                                        disabled={
                                            applyMutation.isPending ||
                                            !selectedProfileId
                                        }
                                        className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-semibold rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'>
                                        {applyMutation.isPending && (
                                            <Loader2
                                                size={14}
                                                className='animate-spin'
                                            />
                                        )}
                                        {applyMutation.isPending ?
                                            'Submitting Application...'
                                        :   'Submit Application'}
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
