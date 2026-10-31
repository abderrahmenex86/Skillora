import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import { formatApplicationStatus } from '../../lib/applicationStatus';
import {
    formatDateTime,
    formatDateTimeRange,
    parseAlgeriaDateTime,
    toAlgeriaDateTimeLocal,
} from '../../lib/dateTime';
import {
    ArrowLeft,
    AlertTriangle,
    ExternalLink,
    FileText,
    FolderOpen,
    Search,
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
    const user = useAuthStore((state) => state.user);
    const isFrozen = user?.companyStatus === 'FROZEN';
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [candidateSearch, setCandidateSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('MATCH_DESC');
    const [resumeOpen, setResumeOpen] = useState(false);
    const [overrideAction, setOverrideAction] = useState<
        'PROMOTE' | 'PROMOTE_EXTEND_CAPACITY' | 'HOLD' | 'REJECT'
    >('PROMOTE');
    const [overrideNotes, setOverrideNotes] = useState('');
    const [overrideError, setOverrideError] = useState('');
    const [deadlineModalOpen, setDeadlineModalOpen] = useState(false);
    const [newDeadline, setNewDeadline] = useState('');
    const [deadlineError, setDeadlineError] = useState('');
    const detailRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

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
            action,
            notes,
        }: {
            appId: string;
            action: string;
            notes: string;
        }) => {
            const { data } = await apiClient.post(
                `/recruiter/applications/${appId}/override`,
                {
                    action,
                    notes,
                }
            );
            return data.application;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['position-applications', positionId],
            });
            queryClient.invalidateQueries({
                queryKey: ['position-detail', positionId],
            });
            queryClient.invalidateQueries({
                queryKey: ['recruiter-positions'],
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

    const normalizedSearch = candidateSearch.trim().toLowerCase();
    const filteredApplications = [...(applications ?? [])]
        .filter((app: any) => {
            const matchesSearch =
                !normalizedSearch ||
                [app.anonymousId, app.profile?.title, app.status]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(normalizedSearch);
            const matchesStatus =
                statusFilter === 'ALL' || app.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a: any, b: any) => {
            if (sortBy === 'MATCH_ASC') {
                return (a.matchScore ?? 0) - (b.matchScore ?? 0);
            }
            if (sortBy === 'NEWEST') {
                return (
                    new Date(b.createdAt ?? 0).getTime() -
                    new Date(a.createdAt ?? 0).getTime()
                );
            }
            return (b.matchScore ?? 0) - (a.matchScore ?? 0);
        });
    const hasActiveFilters =
        candidateSearch.trim() !== '' || statusFilter !== 'ALL';

    useEffect(() => {
        if (isDeadlinePassed && overrideAction === 'PROMOTE') {
            setOverrideAction('PROMOTE_EXTEND_CAPACITY');
        }
    }, [isDeadlinePassed, overrideAction]);

    useEffect(() => {
        if (!selectedAppId) return;
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
    }, [selectedAppId]);

    const closeDetail = () => {
        setSelectedAppId(null);
        requestAnimationFrame(() => {
            listRef.current?.scrollIntoView({
                behavior: 'auto',
                block: 'start',
            });
        });
    };

    const extendDeadlineMutation = useMutation({
        mutationFn: async (value: string) => {
            const parsed = parseAlgeriaDateTime(value);
            if (!parsed) {
                throw new Error('Invalid deadline');
            }
            const { data } = await apiClient.patch(
                `/recruiter/positions/${positionId}/deadline`,
                { newDeadline: parsed.toISOString() }
            );
            return data.position;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['position-detail', positionId],
            });
            queryClient.invalidateQueries({
                queryKey: ['recruiter-positions'],
            });
            setDeadlineModalOpen(false);
            setNewDeadline('');
            setDeadlineError('');
        },
        onError: (err: any) => {
            setDeadlineError(
                err.response?.data?.error || 'Could not extend the deadline.'
            );
        },
    });

    const handleExtendDeadline = (event: React.FormEvent) => {
        event.preventDefault();
        setDeadlineError('');

        if (!newDeadline) {
            setDeadlineError('Choose a new deadline first.');
            return;
        }

        const parsed = parseAlgeriaDateTime(newDeadline);
        if (!parsed) {
            setDeadlineError('Choose a valid date and time.');
            return;
        }

        if (parsed <= new Date()) {
            setDeadlineError('The new deadline must be in the future.');
            return;
        }

        if (positionData && parsed <= new Date(positionData.deadline)) {
            setDeadlineError(
                'The new deadline must be after the current deadline.'
            );
            return;
        }

        extendDeadlineMutation.mutate(newDeadline);
    };

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
            action: overrideAction,
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
                        <div className='mt-1 flex flex-wrap items-center gap-3 text-xs text-(--text-sub) font-mono'>
                            <span>
                                Applications close:{' '}
                                {positionData?.deadline ?
                                    formatDateTime(positionData.deadline)
                                :   ''}{' '}
                                {isDeadlinePassed ? '(CLOSED)' : '(ACTIVE)'}
                            </span>
                            {!isDeadlinePassed && positionData && (
                                <button
                                    type='button'
                                    disabled={isFrozen}
                                    onClick={() => {
                                        setDeadlineError('');
                                        setNewDeadline(
                                            toAlgeriaDateTimeLocal(
                                                positionData.deadline
                                            )
                                        );
                                        setDeadlineModalOpen(true);
                                    }}
                                    className='rounded border border-(--border-line) px-2.5 py-1 text-[10px] font-semibold text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                    Extend deadline
                                </button>
                            )}
                        </div>
                        <div className='mt-1 text-xs text-(--text-sub) font-mono'>
                            Interviews:{' '}
                            {positionData?.interviewRangeStart &&
                            positionData?.interviewRangeEnd ?
                                formatDateTimeRange(
                                    positionData.interviewRangeStart,
                                    positionData.interviewRangeEnd
                                )
                            :   'range not set'}{' '}
                            · Capacity:{' '}
                            {positionData?.interviewCapacity ?? 'not set'}
                        </div>
                    </div>
                    {isDeadlinePassed && (
                        <span className='font-mono text-xs px-2.5 py-1 bg-amber-accent/10 text-amber-accent rounded'>
                            Deadline passed
                        </span>
                    )}
                </div>
            </div>

            {isFrozen && (
                <div className='flex items-start gap-3 rounded-lg border border-amber-accent/30 bg-amber-accent/5 p-4'>
                    <AlertTriangle
                        size={18}
                        className='mt-0.5 shrink-0 text-amber-accent'
                    />
                    <p className='text-xs leading-relaxed text-(--text-sub)'>
                        Your company is frozen. Candidate review is read-only;
                        decisions and deadline changes are disabled.
                    </p>
                </div>
            )}

            <div className='grid grid-cols-1 gap-6 md:min-h-0 md:flex-1 md:grid-cols-12 md:items-stretch'>
                <div
                    ref={listRef}
                    className={`min-h-0 flex-col rounded-lg border border-(--border-line) bg-(--bg-canvas) md:col-span-5 md:flex ${
                        selectedAppId ? 'hidden' : 'flex'
                    }`}>
                    <h3 className='shrink-0 border-b border-(--border-line) px-5 py-4 font-grotesque font-bold text-2xl text-(--text-main)'>
                        Received Applications ({filteredApplications.length}
                        {filteredApplications.length !==
                        (applications?.length ?? 0) ?
                            ` of ${applications?.length ?? 0}`
                        :   ''}
                        )
                    </h3>

                    <div className='shrink-0 space-y-2 border-b border-(--border-line) p-4'>
                        <div className='relative'>
                            <Search
                                size={14}
                                className='absolute left-2.5 top-1/2 -translate-y-1/2 text-(--text-sub)'
                                aria-hidden='true'
                            />
                            <input
                                aria-label='Search candidates'
                                value={candidateSearch}
                                onChange={(event) =>
                                    setCandidateSearch(event.target.value)
                                }
                                placeholder='Search by candidate ID or resume...'
                                className='w-full rounded-md border border-(--border-line) bg-(--bg-panel) py-2 pl-8 pr-3 text-xs text-(--text-main) placeholder:text-(--text-sub)/60 focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                            />
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                            <select
                                aria-label='Filter by status'
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-2 py-1.5 text-[11px] text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'>
                                <option value='ALL'>All statuses</option>
                                <option value='NEEDS_REVIEW'>
                                    Needs review
                                </option>
                                <option value='ON_HOLD'>On hold</option>
                                <option value='INTERVIEW_SCHEDULED'>
                                    Interview scheduled
                                </option>
                                <option value='REJECTED'>Rejected</option>
                            </select>
                            <select
                                aria-label='Sort candidates'
                                value={sortBy}
                                onChange={(event) =>
                                    setSortBy(event.target.value)
                                }
                                className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-2 py-1.5 text-[11px] text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'>
                                <option value='MATCH_DESC'>
                                    Match: high to low
                                </option>
                                <option value='MATCH_ASC'>
                                    Match: low to high
                                </option>
                                <option value='NEWEST'>Newest first</option>
                            </select>
                        </div>
                    </div>

                    <div className='panel-scroll panel-snap flex-1 space-y-3 p-5'>
                    {isLoading ?
                        <div className='text-xs text-(--text-sub)'>
                            Loading cohort submissions...
                        </div>
                    : (applications?.length ?? 0) === 0 ?
                        <div className='text-xs text-(--text-sub) text-center py-8'>
                            <FolderOpen
                                size={32}
                                strokeWidth={1.25}
                                className='mx-auto mb-2 text-(--text-sub)'
                                aria-hidden='true'
                            />
                            No applications received for this position yet.
                        </div>
                    : filteredApplications.length === 0 ?
                        <div className='rounded-md border border-dashed border-(--border-line) px-4 py-8 text-center text-xs text-(--text-sub)'>
                            <p>No candidates match these filters.</p>
                            {hasActiveFilters && (
                                <button
                                    type='button'
                                    onClick={() => {
                                        setCandidateSearch('');
                                        setStatusFilter('ALL');
                                    }}
                                    className='mt-2 font-semibold text-(--text-main) underline'>
                                    Clear filters
                                </button>
                            )}
                        </div>
                    :   filteredApplications.map((app: any) => {
                            const isSelected =
                                (selectedAppId || filteredApplications[0]?.id) ===
                                app.id;
                            return (
                                <div
                                    key={app.id}
                                    data-candidate-card
                                    role='button'
                                    tabIndex={0}
                                    aria-pressed={isSelected}
                                    onClick={() => setSelectedAppId(app.id)}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                        ) {
                                            event.preventDefault();
                                            setSelectedAppId(app.id);
                                        }
                                    }}
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
                                                app.status === 'REJECTED' ||
                                                app.status === 'DECLINED' ?
                                                    'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                                                : app.status === 'ON_HOLD' ?
                                                    'border-amber-accent/40 bg-amber-accent/10 text-amber-accent'
                                                : app.status === 'ELIGIBLE' ||
                                                  app.status ===
                                                      'INTERVIEW_SCHEDULED' ||
                                                  app.status ===
                                                      'INTERVIEW_PENDING' ?
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

                <div
                    ref={detailRef}
                    className={`min-h-0 flex-col rounded-lg border border-(--border-line) bg-(--bg-canvas) md:col-span-7 md:flex ${
                        selectedAppId ? 'flex' : 'hidden'
                    }`}>
                    <div className='panel-scroll flex-1 space-y-6 p-6'>
                    <button
                        type='button'
                        onClick={closeDetail}
                        className='inline-flex items-center gap-1.5 text-xs font-mono text-(--text-sub) transition-colors hover:text-(--text-main) md:hidden'>
                        <ArrowLeft size={14} /> Back to candidates
                    </button>
                    {selectedApp ?
                        <>
                            <div className='flex flex-col gap-3 border-b border-(--border-line) pb-4 sm:flex-row sm:items-start sm:justify-between'>
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
                                    <div className='space-y-3'>
                                        <div className='grid gap-2 sm:grid-cols-3'>
                                            <AuditScore
                                                label='Rubric'
                                                score={
                                                    selectedApp.rubricAudit
                                                        .rubricScore
                                                }
                                            />
                                            <AuditScore
                                                label='Description alignment'
                                                score={
                                                    selectedApp.rubricAudit
                                                        .descriptionAudit
                                                        ?.score
                                                }
                                            />
                                            <AuditScore
                                                label='Experience signal'
                                                score={
                                                    selectedApp.rubricAudit
                                                        .experienceAudit
                                                        ?.targetYears === null ?
                                                        undefined
                                                    :   selectedApp
                                                          .rubricAudit
                                                          .experienceAudit
                                                          ?.score
                                                }
                                                emptyLabel={
                                                    selectedApp.rubricAudit
                                                        .experienceAudit ?
                                                        'No target'
                                                    :   'Not evaluated.'
                                                }
                                            />
                                        </div>

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

                                        <div className='rounded-md border border-(--border-line) bg-(--bg-panel) p-3'>
                                            <div className='flex items-center justify-between gap-2'>
                                                <span className='font-mono text-[9px] uppercase tracking-[0.12em] text-(--text-sub)'>
                                                    Description alignment
                                                </span>
                                                {selectedApp.rubricAudit
                                                    .descriptionAudit ?
                                                    <span className='font-mono text-[10px] font-semibold text-(--text-main)'>
                                                        {
                                                            selectedApp
                                                                .rubricAudit
                                                                .descriptionAudit
                                                                .score
                                                        }
                                                        /100
                                                    </span>
                                                :   <span className='font-mono text-[10px] text-(--text-sub)'>
                                                        Not evaluated.
                                                    </span>
                                                }
                                            </div>
                                            {selectedApp.rubricAudit
                                                .descriptionAudit && (
                                                <>
                                                    <p className='mt-1 text-xs leading-relaxed text-(--text-sub)'>
                                                        {
                                                            selectedApp
                                                                .rubricAudit
                                                                .descriptionAudit
                                                                .rationale
                                                        }
                                                    </p>
                                                    {selectedApp.rubricAudit
                                                        .descriptionAudit.gaps
                                                        ?.length > 0 && (
                                                        <ul className='mt-2 space-y-1 text-[11px] text-(--text-sub)'>
                                                            {selectedApp.rubricAudit.descriptionAudit.gaps.map(
                                                                (
                                                                    gap: string
                                                                ) => (
                                                                    <li
                                                                        key={
                                                                            gap
                                                                        }
                                                                        className='flex gap-1.5'>
                                                                        <span className='text-amber-accent'>
                                                                            –
                                                                        </span>
                                                                        {
                                                                            gap
                                                                        }
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div className='rounded-md border border-(--border-line) bg-(--bg-panel) p-3'>
                                            <div className='flex items-center justify-between gap-2'>
                                                <span className='font-mono text-[9px] uppercase tracking-[0.12em] text-(--text-sub)'>
                                                    Experience signal
                                                </span>
                                                {selectedApp.rubricAudit
                                                    .experienceAudit ?
                                                    <span className='font-mono text-[10px] font-semibold text-(--text-main)'>
                                                        {
                                                            selectedApp
                                                                .rubricAudit
                                                                .experienceAudit
                                                                .score
                                                        }
                                                        /100
                                                    </span>
                                                :   <span className='font-mono text-[10px] text-(--text-sub)'>
                                                        Not evaluated.
                                                    </span>
                                                }
                                            </div>
                                            {selectedApp.rubricAudit
                                                .experienceAudit && (
                                                <>
                                                    <p className='mt-1 font-mono text-[10px] text-(--text-sub)'>
                                                        Preferred{' '}
                                                        {selectedApp
                                                            .rubricAudit
                                                            .experienceAudit
                                                            .targetYears ??
                                                            'not set'}{' '}
                                                        years · proven{' '}
                                                        {selectedApp
                                                            .rubricAudit
                                                            .experienceAudit
                                                            .provenYears ??
                                                            'not verifiable'}{' '}
                                                        years
                                                    </p>
                                                    <p className='mt-1 text-xs leading-relaxed text-(--text-sub)'>
                                                        {
                                                            selectedApp
                                                                .rubricAudit
                                                                .experienceAudit
                                                                .rationale
                                                        }
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                :   <p className='text-xs text-(--text-sub)'>
                                        Evaluation in progress...
                                    </p>
                                }
                            </div>

                            <div className='p-4 border border-(--border-line) rounded-md bg-(--bg-panel)'>
                                <h4 className='font-grotesque font-bold text-xl text-(--text-main) mb-2'>
                                    Manual Review Decision
                                </h4>
                                <p className='text-xs text-(--text-sub) mb-4'>
                                    Standard promotion uses an existing
                                    interview seat and is available before the
                                    deadline. Adding a seat, keeping the
                                    candidate on hold, and rejecting remain
                                    available after the deadline.
                                </p>

                                {overrideError && (
                                    <div className='mb-3 p-2 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded'>
                                        {overrideError}
                                    </div>
                                )}

                                <form
                                    onSubmit={handleOverrideSubmit}
                                    className='space-y-3'>
                                    <div className='grid gap-2 sm:grid-cols-2'>
                                        {[
                                            {
                                                value: 'PROMOTE',
                                                label: 'Promote to eligible',
                                                hint: 'Use a free interview seat. Before the deadline only.',
                                                disabled: isDeadlinePassed,
                                            },
                                            {
                                                value: 'PROMOTE_EXTEND_CAPACITY',
                                                label: 'Promote + extend interview seats',
                                                hint: 'Add one final-round seat and schedule immediately.',
                                                disabled: false,
                                            },
                                            {
                                                value: 'HOLD',
                                                label: 'Keep on hold',
                                                hint: 'Eligible, waitlisted for the next available seat.',
                                                disabled: false,
                                            },
                                            {
                                                value: 'REJECT',
                                                label: 'Reject',
                                                hint: 'Close the application and issue feedback.',
                                                disabled: false,
                                            },
                                        ].map((option) => (
                                            <label
                                                key={option.value}
                                                className={`flex gap-2 rounded border p-3 text-xs ${
                                                    option.disabled ?
                                                        'cursor-not-allowed border-(--border-line) opacity-50'
                                                    : overrideAction ===
                                                        option.value ?
                                                        'cursor-pointer border-(--text-main) bg-(--bg-canvas)'
                                                    :   'cursor-pointer border-(--border-line) hover:bg-(--bg-canvas)'
                                                }`}>
                                                <input
                                                    type='radio'
                                                    name='overrideAction'
                                                    value={option.value}
                                                    checked={
                                                        overrideAction ===
                                                        option.value
                                                    }
                                                    onChange={() =>
                                                        setOverrideAction(
                                                            option.value as
                                                                | 'PROMOTE'
                                                                | 'PROMOTE_EXTEND_CAPACITY'
                                                                | 'HOLD'
                                                                | 'REJECT'
                                                        )
                                                    }
                                                    disabled={
                                                        option.disabled ||
                                                        isFrozen
                                                    }
                                                    className='mt-0.5'
                                                />
                                                <span>
                                                    <span className='block font-semibold text-(--text-main)'>
                                                        {option.label}
                                                    </span>
                                                    <span className='mt-0.5 block text-[11px] leading-relaxed text-(--text-sub)'>
                                                        {option.hint}
                                                    </span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>

                                    <input
                                        type='text'
                                        required
                                        placeholder='Decision notes (required for audit)'
                                        value={overrideNotes}
                                        onChange={(e) =>
                                            setOverrideNotes(e.target.value)
                                        }
                                        disabled={isFrozen}
                                        className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none disabled:opacity-60'
                                    />

                                    <button
                                        type='submit'
                                        disabled={
                                            overrideMutation.isPending ||
                                            isFrozen
                                        }
                                        className='w-full py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-mono uppercase tracking-wider rounded font-semibold hover:opacity-90 disabled:opacity-50'>
                                        {overrideMutation.isPending ?
                                            'Saving Decision...'
                                        :   'Apply Manual Decision'}
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
            {deadlineModalOpen && (
                <div
                    className='modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
                    role='dialog'
                    aria-modal='true'
                    aria-label='Extend application deadline'>
                    <form
                        onSubmit={handleExtendDeadline}
                        className='modal-panel w-full max-w-md rounded-lg border border-(--border-line) bg-(--bg-canvas) p-6'>
                        <h3 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Extend deadline
                        </h3>
                        <p className='mt-1 text-xs leading-relaxed text-(--text-sub)'>
                            Current deadline:{' '}
                            {positionData?.deadline ?
                                formatDateTime(positionData.deadline)
                            :   '—'}
                        </p>

                        <label className='mt-4 block'>
                            <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                New application deadline
                            </span>
                            <input
                                type='datetime-local'
                                required
                                min={toAlgeriaDateTimeLocal(new Date())}
                                value={newDeadline}
                                onChange={(event) =>
                                    setNewDeadline(event.target.value)
                                }
                                className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2.5 text-sm text-(--text-main) outline-none focus:border-(--text-main)'
                            />
                        </label>
                        <p className='mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-(--text-sub)'>
                            Africa/Algiers (UTC+1). Must be after the current
                            deadline.
                        </p>

                        {deadlineError && (
                            <p className='mt-2 text-xs text-red-600 dark:text-red-400'>
                                {deadlineError}
                            </p>
                        )}

                        <div className='mt-5 flex justify-end gap-2'>
                            <button
                                type='button'
                                onClick={() => setDeadlineModalOpen(false)}
                                className='rounded-md border border-(--border-line) px-4 py-2 text-xs font-semibold text-(--text-main)'>
                                Cancel
                            </button>
                            <button
                                type='submit'
                                disabled={extendDeadlineMutation.isPending}
                                className='rounded-md bg-(--btn-main-bg) px-4 py-2 text-xs font-semibold text-(--btn-main-text) disabled:opacity-50'>
                                {extendDeadlineMutation.isPending ?
                                    'Extending...'
                                :   'Extend deadline'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function AuditScore({
    label,
    score,
    emptyLabel = 'Not evaluated.',
}: {
    label: string;
    score?: number | null;
    emptyLabel?: string;
}) {
    const hasScore = typeof score === 'number' && Number.isFinite(score);

    return (
        <div className='rounded-md border border-(--border-line) bg-(--bg-canvas) p-3'>
            <p className='font-mono text-[9px] uppercase tracking-[0.12em] text-(--text-sub)'>
                {label}
            </p>
            <p className='mt-1 font-grotesque text-xl font-bold text-(--text-main)'>
                {hasScore ? `${score}/100` : emptyLabel}
            </p>
        </div>
    );
}
