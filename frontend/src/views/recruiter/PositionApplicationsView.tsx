import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import {
    ArrowLeft,
    Check,
    AlertTriangle,
    ExternalLink,
    FileText,
    FolderOpen,
    X,
} from 'lucide-react';
import {
    RESUME_INFO_KINDS,
    INFO_LABELS,
    describeInfo,
    getLibraryItems,
    type VaultLibrary,
} from '../applicant/resume/types';

interface ApplicationResume extends VaultLibrary {
    title: string;
    summary?: string | null;
    skills: string[];
    resumeUrl?: string | null;
}

export default function PositionApplicationsView() {
    const { id: positionId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [resumeOpen, setResumeOpen] = useState(false);
    const [overrideStatus, setOverrideStatus] = useState<
        'ELIGIBLE' | 'REDIRECTED'
    >('ELIGIBLE');
    const [overrideNotes, setOverrideNotes] = useState('');
    const [overrideError, setOverrideError] = useState('');

    const { data: positionData } = useQuery({
        queryKey: ['position-detail', positionId],
        queryFn: async () => {
            const { data } = await apiClient.get(
                `/recruiter/positions/${positionId}`
            );
            return data.position;
        },
    });

    const { data: applications, isLoading } = useQuery({
        queryKey: ['position-applications', positionId],
        queryFn: async () => {
            const { data } = await apiClient.get(
                `/recruiter/positions/${positionId}/applications`
            );
            return data.applications;
        },
    });

    const overrideMutation = useMutation({
        mutationFn: async ({
            appId,
            status,
            notes,
        }: {
            appId: string;
            status: string;
            notes: string;
        }) => {
            const { data } = await apiClient.post(
                `/recruiter/applications/${appId}/override`,
                {
                    newStatus: status,
                    notes,
                }
            );
            return data.application;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['position-applications', positionId],
            });
            setOverrideNotes('');
            setOverrideError('');
        },
        onError: (err: any) => {
            setOverrideError(err.response?.data?.error || 'Override failed');
        },
    });

    const selectedApp =
        applications?.find((a: any) => a.id === selectedAppId) ||
        applications?.[0];
    const isDeadlinePassed =
        positionData ? new Date() >= new Date(positionData.deadline) : false;
    const selectedApplicationId = selectedApp?.id;

    const {
        data: resumePreview,
        isLoading: resumeLoading,
        error: resumeError,
    } = useQuery({
        queryKey: ['application-resume', selectedApplicationId],
        queryFn: async () => {
            if (!selectedApplicationId) {
                throw new Error('No application selected');
            }
            const { data } = await apiClient.get(
                `/recruiter/applications/${selectedApplicationId}/resume`
            );
            return data.resume as ApplicationResume;
        },
        enabled: resumeOpen && Boolean(selectedApplicationId),
    });

    useEffect(() => {
        if (!resumeOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setResumeOpen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [resumeOpen]);

    const handleOverrideSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp) return;
        setOverrideError('');
        overrideMutation.mutate({
            appId: selectedApp.id,
            status: overrideStatus,
            notes: overrideNotes,
        });
    };

    return (
        <div className='flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-5 overflow-y-auto mx-auto px-6 py-6 lg:overflow-hidden'>
            <div className='shrink-0'>
                <Link
                    to='/recruiter/positions'
                    className='text-xs font-mono text-(--text-sub) hover:text-(--text-main) inline-flex items-center gap-1 mb-2'>
                    <ArrowLeft size={14} /> Back to Positions
                </Link>
                <div className='flex justify-between items-center'>
                    <div>
                        <h1 className='font-grotesque font-extrabold text-3xl text-(--text-main)'>
                            {positionData?.title} — Candidate Cohort
                        </h1>
                        <div className='text-xs text-(--text-sub) font-mono'>
                            Applications close:{' '}
                            {positionData?.deadline ?
                                new Date(positionData.deadline).toLocaleString()
                            :   ''}{' '}
                            {isDeadlinePassed ? '(CLOSED)' : '(ACTIVE)'}
                        </div>
                        <div className='mt-1 text-xs text-(--text-sub) font-mono'>
                            Interviews:{' '}
                            {positionData?.interviewRangeStart &&
                            positionData?.interviewRangeEnd ?
                                `${new Date(
                                    positionData.interviewRangeStart
                                ).toLocaleString()} – ${new Date(
                                    positionData.interviewRangeEnd
                                ).toLocaleString()}`
                            :   'range not set'}{' '}
                            · Capacity:{' '}
                            {positionData?.interviewCapacity ?? 'not set'}
                        </div>
                    </div>
                    {isDeadlinePassed && (
                        <span className='font-mono text-xs px-2.5 py-1 bg-amber-accent/10 text-amber-accent rounded'>
                            Override Locked (Deadline Passed)
                        </span>
                    )}
                </div>
            </div>

            <div className='grid grid-cols-1 gap-6 md:min-h-0 md:flex-1 md:grid-cols-12 md:items-stretch'>
                <div className='flex min-h-0 flex-col rounded-lg border border-(--border-line) bg-(--bg-canvas) md:col-span-5'>
                    <h3 className='shrink-0 border-b border-(--border-line) px-5 py-4 font-grotesque font-bold text-2xl text-(--text-main)'>
                        Received Applications ({applications?.length ?? 0})
                    </h3>

                    <div className='panel-scroll panel-snap flex-1 space-y-3 p-5'>
                    {isLoading ?
                        <div className='text-xs text-(--text-sub)'>
                            Loading cohort submissions...
                        </div>
                    : applications?.length === 0 ?
                        <div className='text-xs text-(--text-sub) text-center py-8'>
                            <FolderOpen
                                size={32}
                                strokeWidth={1.25}
                                className='mx-auto mb-2 text-(--text-sub)'
                                aria-hidden='true'
                            />
                            No applications received for this position yet.
                        </div>
                    :   applications?.map((app: any) => {
                            const isSelected =
                                (selectedAppId || applications[0]?.id) ===
                                app.id;
                            return (
                                <div
                                    key={app.id}
                                    onClick={() => setSelectedAppId(app.id)}
                                    className={`relative p-4 rounded-md border cursor-pointer transition-all ${
                                        isSelected ?
                                            'border-(--text-main) bg-(--bg-canvas) ring-1 ring-(--text-main)'
                                        :   'border-(--border-line) bg-(--bg-canvas) hover:border-(--text-sub)'
                                    }`}>
                                    <span
                                        aria-hidden='true'
                                        className='snap-anchor'
                                    />
                                    <div className='flex justify-between items-start mb-1'>
                                        <div>
                                            <h4 className='font-grotesque font-bold text-xl text-(--text-main)'>
                                                Candidate {app.anonymousId}
                                            </h4>
                                            <div className='text-xs text-(--text-sub)'>
                                                {app.profile.title}
                                            </div>
                                        </div>
                                        <span className='font-mono text-xs font-semibold px-2 py-0.5 rounded bg-(--bg-panel)'>
                                            {app.matchScore ?? 0}% Match
                                        </span>
                                    </div>

                                    <div className='flex items-center gap-2 mt-2'>
                                        <span
                                            className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                                                app.status === 'REJECTED' ?
                                                    'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                                                : app.status === 'ELIGIBLE' ||
                                                  app.status ===
                                                      'INTERVIEW_SCHEDULED' ?
                                                    'border-forest/30 bg-forest/10 text-forest dark:text-forest-dark'
                                                :   'border-(--border-line) text-(--text-sub)'
                                            }`}>
                                            {formatApplicationStatus(app.status)}
                                        </span>
                                        {app.recruiterOverride && (
                                            <span className='font-mono text-[10px] text-forest dark:text-forest-dark font-medium'>
                                                Manual Override Active
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    }
                    </div>
                </div>

                <div className='flex min-h-0 flex-col rounded-lg border border-(--border-line) bg-(--bg-canvas) md:col-span-7'>
                    <div className='panel-scroll flex-1 space-y-6 p-6'>
                    {selectedApp ?
                        <>
                            <div className='border-b border-(--border-line) pb-4 flex justify-between items-start'>
                                <div>
                                    <h2 className='font-grotesque font-extrabold text-3xl text-(--text-main)'>
                                        Candidate {selectedApp.anonymousId}
                                    </h2>
                                    <div className='text-xs text-(--text-sub)'>
                                        Resume: {selectedApp.profile.title}
                                    </div>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <button
                                        type='button'
                                        onClick={() => setResumeOpen(true)}
                                        className='px-3 py-1.5 border border-(--border-line) text-xs font-mono rounded hover:bg-(--bg-panel) inline-flex items-center gap-1.5 text-(--text-main)'>
                                        <FileText size={13} /> View Resume
                                    </button>
                                    {selectedApp.profile.resumeUrl && (
                                        <a
                                            href={
                                                selectedApp.profile.resumeUrl
                                            }
                                            target='_blank'
                                            rel='noreferrer'
                                            className='px-2.5 py-1.5 border border-(--border-line) text-xs font-mono rounded hover:bg-(--bg-panel) inline-flex items-center gap-1.5 text-(--text-sub)'>
                                            PDF <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {(selectedApp.profile.summary ||
                                selectedApp.profile.skills?.length > 0) && (
                                <div className='rounded-md border border-(--border-line) bg-(--bg-panel) p-4'>
                                    <h4 className='font-grotesque text-lg font-bold text-(--text-main)'>
                                        Tailored Resume
                                    </h4>
                                    {selectedApp.profile.summary && (
                                        <p className='mt-1 text-xs leading-relaxed text-(--text-sub)'>
                                            {selectedApp.profile.summary}
                                        </p>
                                    )}
                                    {selectedApp.profile.skills?.length >
                                        0 && (
                                        <div className='mt-3 flex flex-wrap gap-1.5'>
                                            {selectedApp.profile.skills.map(
                                                (skill: string) => (
                                                    <span
                                                        key={skill}
                                                        className='rounded border border-(--border-line) px-2 py-0.5 font-mono text-[10px] text-(--text-sub)'>
                                                        {skill}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <h4 className='font-grotesque font-bold text-xl text-(--text-main) mb-2'>
                                    Autonomous Rubric Audit
                                </h4>
                                {(
                                    selectedApp.rubricAudit
                                        ?.mandatoryCriteriaAudit
                                ) ?
                                    <div className='space-y-2'>
                                        {selectedApp.rubricAudit.mandatoryCriteriaAudit.map(
                                            (audit: any, i: number) => (
                                                <div
                                                    key={i}
                                                    className='p-3 border border-(--border-line) rounded text-xs flex justify-between items-center'>
                                                    <span className='text-(--text-main)'>
                                                        {audit.criterion}
                                                    </span>
                                                    <span
                                                        className={`font-mono text-[10px] uppercase font-semibold ${
                                                            audit.satisfied ?
                                                                'text-forest dark:text-forest-dark'
                                                            :   'text-amber-accent'
                                                        }`}>
                                                        {audit.satisfied ?
                                                            'Satisfied'
                                                        :   'Missing'}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                :   <p className='text-xs text-(--text-sub)'>
                                        Evaluation in progress...
                                    </p>
                                }
                            </div>

                            <div className='p-4 border border-(--border-line) rounded-md bg-(--bg-panel)'>
                                <h4 className='font-grotesque font-bold text-xl text-(--text-main) mb-2'>
                                    Manual Intervention Override
                                </h4>
                                <p className='text-xs text-(--text-sub) mb-4'>
                                    Recruiters can manually override candidate
                                    status strictly before the position closing
                                    deadline.
                                </p>

                                {overrideError && (
                                    <div className='mb-3 p-2 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded'>
                                        {overrideError}
                                    </div>
                                )}

                                <form
                                    onSubmit={handleOverrideSubmit}
                                    className='space-y-3'>
                                    <div className='flex gap-4'>
                                        <label className='flex items-center gap-1.5 text-xs text-(--text-main)'>
                                            <input
                                                type='radio'
                                                name='overrideStatus'
                                                value='ELIGIBLE'
                                                checked={
                                                    overrideStatus ===
                                                    'ELIGIBLE'
                                                }
                                                onChange={() =>
                                                    setOverrideStatus(
                                                        'ELIGIBLE'
                                                    )
                                                }
                                                disabled={isDeadlinePassed}
                                            />
                                            Promote to Eligible (Schedule
                                            Interview)
                                        </label>
                                        <label className='flex items-center gap-1.5 text-xs text-(--text-main)'>
                                            <input
                                                type='radio'
                                                name='overrideStatus'
                                                value='REDIRECTED'
                                                checked={
                                                    overrideStatus ===
                                                    'REDIRECTED'
                                                }
                                                onChange={() =>
                                                    setOverrideStatus(
                                                        'REDIRECTED'
                                                    )
                                                }
                                                disabled={isDeadlinePassed}
                                            />
                                            Redirect (Issue Gap Roadmap)
                                        </label>
                                    </div>

                                    <input
                                        type='text'
                                        required
                                        disabled={isDeadlinePassed}
                                        placeholder='Override justification notes'
                                        value={overrideNotes}
                                        onChange={(e) =>
                                            setOverrideNotes(e.target.value)
                                        }
                                        className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                                    />

                                    <button
                                        type='submit'
                                        disabled={
                                            isDeadlinePassed ||
                                            overrideMutation.isPending
                                        }
                                        className='w-full py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-mono uppercase tracking-wider rounded font-semibold hover:opacity-90 disabled:opacity-50'>
                                        {overrideMutation.isPending ?
                                            'Saving Override...'
                                        :   'Apply Manual Override'}
                                    </button>
                                </form>
                            </div>
                        </>
                    :   <div className='text-xs text-(--text-sub) py-8 text-center'>
                            Select an application on the left to inspect
                            qualifications.
                        </div>
                    }
                    </div>
                </div>
            </div>

            {resumeOpen && selectedApp && (
                <div
                    className='modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setResumeOpen(false);
                        }
                    }}>
                    <div className='modal-panel max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-(--border-line) bg-(--bg-canvas) shadow-xl'>
                        <div className='flex items-center justify-between border-b border-(--border-line) px-6 py-4'>
                            <div>
                                <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                                    Tailored Resume
                                </h2>
                                <p className='mt-0.5 font-mono text-[10px] text-(--text-sub)'>
                                    Candidate {selectedApp.anonymousId}
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setResumeOpen(false)}
                                aria-label='Close resume preview'
                                className='rounded-md p-1.5 text-(--text-sub) transition-colors hover:bg-(--bg-panel) hover:text-(--text-main)'>
                                <X size={18} />
                            </button>
                        </div>

                        <div className='p-6'>
                            {resumeLoading ?
                                <div className='py-10 text-center text-xs text-(--text-sub)'>
                                    Loading resume...
                                </div>
                            : resumeError ?
                                <div className='rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400'>
                                    Could not load this tailored resume.
                                </div>
                            : resumePreview ?
                                <div className='space-y-5'>
                                    <div>
                                        <h3 className='font-grotesque text-3xl font-extrabold text-(--text-main)'>
                                            {resumePreview.title}
                                        </h3>
                                        {resumePreview.summary && (
                                            <p className='mt-2 text-sm leading-relaxed text-(--text-sub)'>
                                                {resumePreview.summary}
                                            </p>
                                        )}
                                        {resumePreview.skills?.length > 0 && (
                                            <div className='mt-3 flex flex-wrap gap-1.5'>
                                                {resumePreview.skills.map(
                                                    (skill) => (
                                                        <span
                                                            key={skill}
                                                            className='rounded border border-(--border-line) bg-(--bg-panel) px-2 py-0.5 font-mono text-[10px] text-(--text-sub)'>
                                                            {skill}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className='space-y-5 border-t border-(--border-line) pt-5'>
                                        {RESUME_INFO_KINDS.map((kind) => {
                                            const items = getLibraryItems(
                                                resumePreview,
                                                kind
                                            );
                                            if (items.length === 0) return null;
                                            return (
                                                <section key={kind}>
                                                    <h4 className='mb-2 font-mono text-[10px] uppercase tracking-wide text-(--text-sub)'>
                                                        {INFO_LABELS[kind]}
                                                    </h4>
                                                    <div className='space-y-2'>
                                                        {items.map((item) => {
                                                            const info =
                                                                describeInfo(
                                                                    kind,
                                                                    item
                                                                );
                                                            return (
                                                                <div
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    className='rounded-md border border-(--border-line) bg-(--bg-panel) p-3'>
                                                                    <div className='text-sm font-semibold text-(--text-main)'>
                                                                        {
                                                                            info.title
                                                                        }
                                                                    </div>
                                                                    {info.subtitle && (
                                                                        <div className='mt-0.5 text-xs text-(--text-sub)'>
                                                                            {
                                                                                info.subtitle
                                                                            }
                                                                        </div>
                                                                    )}
                                                                    {info.description && (
                                                                        <p className='mt-1 text-xs leading-relaxed text-(--text-sub)'>
                                                                            {
                                                                                info.description
                                                                            }
                                                                        </p>
                                                                    )}
                                                                    {info.tags &&
                                                                        info.tags
                                                                            .length >
                                                                            0 && (
                                                                            <div className='mt-2 flex flex-wrap gap-1'>
                                                                                {info.tags.map(
                                                                                    (
                                                                                        tag
                                                                                    ) => (
                                                                                        <span
                                                                                            key={
                                                                                                tag
                                                                                            }
                                                                                            className='rounded border border-(--border-line) px-1.5 py-0.5 font-mono text-[9px] text-(--text-sub)'>
                                                                                            {
                                                                                                tag
                                                                                            }
                                                                                        </span>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    {info.url && (
                                                                        <a
                                                                            href={
                                                                                info.url
                                                                            }
                                                                            target='_blank'
                                                                            rel='noreferrer'
                                                                            className='mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-(--text-sub) underline hover:text-(--text-main)'>
                                                                            Open link{' '}
                                                                            <ExternalLink
                                                                                size={
                                                                                    10
                                                                                }
                                                                            />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            );
                                        })}

                                        {RESUME_INFO_KINDS.every(
                                            (kind) =>
                                                getLibraryItems(
                                                    resumePreview,
                                                    kind
                                                ).length === 0
                                        ) && (
                                            <div className='rounded border border-dashed border-(--border-line) px-4 py-8 text-center text-xs text-(--text-sub)'>
                                                No information was selected for
                                                this resume.
                                            </div>
                                        )}
                                    </div>

                                    {resumePreview.resumeUrl && (
                                        <a
                                            href={resumePreview.resumeUrl}
                                            target='_blank'
                                            rel='noreferrer'
                                            className='inline-flex items-center gap-1.5 rounded border border-(--border-line) px-3 py-2 text-xs font-medium text-(--text-main) hover:bg-(--bg-panel)'>
                                            Open uploaded PDF{' '}
                                            <ExternalLink size={13} />
                                        </a>
                                    )}
                                </div>
                            :   null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
