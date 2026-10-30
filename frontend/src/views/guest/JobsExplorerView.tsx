import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import {
    Search,
    ArrowRight,
    ArrowLeft,
    Check,
    Copy,
    Linkedin,
    Loader2,
    LogIn,
    Share2,
    UserPlus,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatDeadline } from '../../lib/dateTime';

export default function JobsExplorerView() {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const { jobId } = useParams<{ jobId?: string }>();
    const navigate = useNavigate();

    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [appliedSuccess, setAppliedSuccess] = useState(false);
    const [applyError, setApplyError] = useState('');
    const [copied, setCopied] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const detailRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!jobId) return;
        if (!window.matchMedia('(max-width: 767px)').matches) return;

        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;
        requestAnimationFrame(() => {
            detailRef.current?.scrollIntoView({
                behavior: reducedMotion ? 'auto' : 'smooth',
                block: 'start',
            });
        });
    }, [jobId]);

    const { data: positions, isLoading } = useQuery({
        queryKey: ['public-positions'],
        queryFn: async () => {
            const { data } = await apiClient.get('/public/positions');
            return data.positions;
        },
    });

    const selectedFromList = positions?.find((job: any) => job.id === jobId);

    const {
        data: standaloneJob,
        isLoading: standaloneLoading,
    } = useQuery({
        queryKey: ['public-position', jobId],
        queryFn: async () => {
            const { data } = await apiClient.get(
                `/public/positions/${jobId}`
            );
            return data.position;
        },
        enabled: Boolean(jobId) && !isLoading && !selectedFromList,
        retry: false,
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
        selectedFromList ??
        standaloneJob ??
        (!jobId ? positions?.[0] : undefined);
    const jobNotFound =
        Boolean(jobId) &&
        !isLoading &&
        !standaloneLoading &&
        !selectedJob;
    const isJobOpen = Boolean(
        selectedJob &&
            selectedJob.status === 'OPEN' &&
            new Date(selectedJob.deadline).getTime() > Date.now()
    );

    const selectedJobHasApplied = Boolean(
        selectedJob && appliedPositionIds.has(selectedJob.id)
    );

    const shareOrigin = (
        (import.meta.env.VITE_SHARE_ORIGIN as string | undefined) ||
        window.location.origin
    ).replace(/\/$/, '');
    const shareUrl =
        selectedJob ?
            `${shareOrigin}/share/jobs/${selectedJob.id}`
        :   '';
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    const jobPath = selectedJob ? `/jobs/${selectedJob.id}` : '/jobs';
    const registerUrl = `/auth?mode=register&redirect=${encodeURIComponent(jobPath)}`;
    const loginUrl = `/auth?mode=login&redirect=${encodeURIComponent(jobPath)}`;

    const copyShareLink = async () => {
        if (!shareUrl) return;

        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt('Copy this link', shareUrl);
        }
    };

    const canNativeShare =
        typeof navigator !== 'undefined' && 'share' in navigator;

    const nativeShare = () => {
        if (!selectedJob) return;
        const share = (
            navigator as Navigator & {
                share?: (data: {
                    title?: string;
                    text?: string;
                    url?: string;
                }) => Promise<void>;
            }
        ).share;
        if (!share) return;
        void share({
            title: `${selectedJob.title} at ${selectedJob.companyName}`,
            text: `Apply for ${selectedJob.title} at ${selectedJob.companyName} on Skillora.`,
            url: shareUrl,
        }).catch(() => {});
    };

    const selectJob = (id: string) => {
        setAppliedSuccess(false);
        setApplyError('');
        navigate(`/jobs/${id}`);
    };

    const backToJobs = () => {
        setAppliedSuccess(false);
        setApplyError('');
        navigate('/jobs');
    };

    useEffect(() => {
        document.title =
            jobId && selectedJob ?
                `${selectedJob.title} at ${selectedJob.companyName} — Skillora`
            :   'Jobs — Skillora';

        return () => {
            document.title = 'Skillora — Autonomous Recruitment Platform';
        };
    }, [jobId, selectedJob]);

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
            : positions?.length === 0 && !jobId ?
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
                    <div
                        ref={listRef}
                        className={`flex-col gap-3 md:col-span-5 md:min-h-0 md:flex ${
                            jobId ? 'hidden' : 'flex'
                        }`}>
                        <h3 className='shrink-0 font-grotesque font-bold text-2xl text-(--text-main)'>
                            Available Jobs ({positions?.length ?? 0})
                        </h3>
                        <div className='panel-scroll panel-snap flex-1 space-y-3 md:pr-1'>
                        {positions?.map((job: any) => {
                            const isSelected =
                                (jobId || positions[0]?.id) === job.id;
                            return (
                                <div
                                    key={job.id}
                                    role='button'
                                    tabIndex={0}
                                    aria-pressed={isSelected}
                                    onClick={() => selectJob(job.id)}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                        ) {
                                            event.preventDefault();
                                            selectJob(job.id);
                                        }
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

                                    <div className='mt-3 flex flex-col gap-1 text-xs font-mono text-(--text-sub) lg:flex-row lg:items-center lg:justify-between'>
                                        <div className='flex flex-wrap items-center gap-2'>
                                            <span>{job.department}</span>
                                            {appliedPositionIds.has(job.id) && (
                                                <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-forest/10 text-forest dark:text-forest-dark'>
                                                    <Check size={10} />
                                                    Applied
                                                </span>
                                            )}
                                        </div>
                                        <span className='text-amber-accent'>
                                            {formatDeadline(job.deadline)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    </div>

                    <div
                        ref={detailRef}
                        className={`panel-scroll rounded-lg border border-(--border-line) bg-(--bg-canvas) p-6 space-y-6 md:col-span-7 md:flex md:flex-col md:p-8 ${
                            jobId ? 'flex flex-col' : 'hidden'
                        }`}>
                        <button
                            type='button'
                            onClick={backToJobs}
                            className='inline-flex items-center gap-1.5 text-xs font-mono text-(--text-sub) transition-colors hover:text-(--text-main) md:hidden'>
                            <ArrowLeft size={14} /> Back to jobs
                        </button>
                        {jobId && standaloneLoading && !selectedJob && (
                            <div className='flex items-center gap-2 py-8 text-xs text-(--text-sub)'>
                                <Loader2
                                    size={14}
                                    className='animate-spin'
                                />
                                Loading job...
                            </div>
                        )}
                        {jobNotFound && (
                            <div className='py-10 text-center'>
                                <h2 className='font-grotesque text-3xl font-extrabold text-(--text-main)'>
                                    This role is no longer available.
                                </h2>
                                <p className='mx-auto mt-2 max-w-md text-sm leading-relaxed text-(--text-sub)'>
                                    The job may have been removed or the link
                                    may be out of date. Browse the open roles
                                    to find another fit.
                                </p>
                                <button
                                    type='button'
                                    onClick={backToJobs}
                                    className='mt-5 rounded-md bg-(--btn-main-bg) px-5 py-2.5 text-sm font-semibold text-(--btn-main-text) transition-opacity hover:opacity-90'>
                                    Browse open roles
                                </button>
                            </div>
                        )}
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
                                    <div className='mt-3 flex flex-wrap items-center gap-2'>
                                        <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                            Share
                                        </span>
                                        <a
                                            href={linkedInUrl}
                                            target='_blank'
                                            rel='noreferrer'
                                            aria-label='Share on LinkedIn'
                                            className='inline-flex items-center gap-1.5 rounded-md border border-(--border-line) px-2.5 py-1.5 text-[11px] font-medium text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                            <Linkedin size={13} />
                                            LinkedIn
                                        </a>
                                        <button
                                            type='button'
                                            onClick={copyShareLink}
                                            className='inline-flex items-center gap-1.5 rounded-md border border-(--border-line) px-2.5 py-1.5 text-[11px] font-medium text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                            {copied ?
                                                <Check size={13} />
                                            :   <Copy size={13} />}
                                            {copied ? 'Copied' : 'Copy link'}
                                        </button>
                                        {canNativeShare && (
                                            <button
                                                type='button'
                                                onClick={nativeShare}
                                                className='inline-flex items-center gap-1.5 rounded-md border border-(--border-line) px-2.5 py-1.5 text-[11px] font-medium text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                                <Share2 size={13} />
                                                Share
                                            </button>
                                        )}
                                    </div>
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
                                    {!isJobOpen ?
                                        <div className='rounded-md border border-(--border-line) bg-(--bg-panel) p-4 text-center'>
                                            <p className='font-mono text-xs font-semibold uppercase tracking-[0.12em] text-(--text-main)'>
                                                Applications closed
                                            </p>
                                            <p className='mx-auto mt-2 max-w-sm text-xs leading-relaxed text-(--text-sub)'>
                                                This role is no longer accepting
                                                applications. Browse the open
                                                roles to find another fit.
                                            </p>
                                            <button
                                                type='button'
                                                onClick={backToJobs}
                                                className='mt-3 text-xs font-semibold text-(--text-main) underline'>
                                                Browse open roles
                                            </button>
                                        </div>
                                    : !user ?
                                        <div className='space-y-3 rounded-md border border-(--border-line) bg-(--bg-panel) p-4 text-center'>
                                            <div className='flex items-center justify-center gap-2 text-xs text-(--text-sub)'>
                                                <UserPlus size={14} />
                                                Create an account to apply for
                                                this role
                                            </div>
                                            <div className='flex flex-col items-center justify-center gap-2 sm:flex-row'>
                                                <Link
                                                    to={registerUrl}
                                                    className='inline-flex w-full items-center justify-center gap-1.5 self-stretch rounded-md bg-(--btn-main-bg) px-3 py-2.5 text-[10px] font-mono uppercase tracking-[0.08em] text-(--btn-main-text) font-semibold transition-opacity hover:opacity-90 sm:w-auto sm:gap-2 sm:px-5 sm:text-xs sm:tracking-wider'>
                                                    <UserPlus size={13} />
                                                    Create an account to apply
                                                </Link>
                                                <Link
                                                    to={loginUrl}
                                                    className='inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-(--text-main) underline'>
                                                    <LogIn size={13} />
                                                    Already have an account?
                                                    Log in
                                                </Link>
                                            </div>
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
                                            <div className='mt-2 flex flex-wrap items-center justify-center gap-3 text-[11px]'>
                                                <Link
                                                    to='/applicant/dashboard'
                                                    className='font-semibold underline'>
                                                    View application status
                                                </Link>
                                                <button
                                                    type='button'
                                                    onClick={backToJobs}
                                                    className='font-semibold underline'>
                                                    Browse more jobs
                                                </button>
                                            </div>
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
