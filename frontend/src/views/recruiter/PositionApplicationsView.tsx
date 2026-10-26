import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { ArrowLeft, Check, AlertTriangle, ExternalLink } from 'lucide-react';

export default function PositionApplicationsView() {
    const { id: positionId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
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
        <div className='flex-1 max-w-7xl w-full mx-auto px-6 py-8'>
            <div className='mb-6'>
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
                            Deadline:{' '}
                            {positionData?.deadline ?
                                new Date(positionData.deadline).toLocaleString()
                            :   ''}{' '}
                            {isDeadlinePassed ? '(CLOSED)' : '(ACTIVE)'}
                        </div>
                    </div>
                    {isDeadlinePassed && (
                        <span className='font-mono text-xs px-2.5 py-1 bg-amber-accent/10 text-amber-accent rounded'>
                            Override Locked (Deadline Passed)
                        </span>
                    )}
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-12 gap-8 items-start'>
                <div className='md:col-span-5 border border-(--border-line) rounded-lg p-5 bg-(--bg-canvas) space-y-3'>
                    <h3 className='font-grotesque font-bold text-2xl text-(--text-main) mb-2'>
                        Received Applications ({applications?.length ?? 0})
                    </h3>

                    {isLoading ?
                        <div className='text-xs text-(--text-sub)'>
                            Loading cohort submissions...
                        </div>
                    : applications?.length === 0 ?
                        <div className='text-xs text-(--text-sub) text-center py-8'>
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
                                    className={`p-4 rounded-md border cursor-pointer transition-all ${
                                        isSelected ?
                                            'border-(--text-main) bg-(--bg-canvas) ring-1 ring-(--text-main)'
                                        :   'border-(--border-line) bg-(--bg-canvas) hover:border-(--text-sub)'
                                    }`}>
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
                                        <span className='font-mono text-[10px] px-2 py-0.5 rounded border border-(--border-line) text-(--text-sub)'>
                                            {app.status}
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

                <div className='md:col-span-7 border border-(--border-line) rounded-lg p-6 bg-(--bg-canvas) space-y-6'>
                    {selectedApp ?
                        <>
                            <div className='border-b border-(--border-line) pb-4 flex justify-between items-start'>
                                <div>
                                    <h2 className='font-grotesque font-extrabold text-3xl text-(--text-main)'>
                                        Candidate {selectedApp.anonymousId}
                                    </h2>
                                    <div className='text-xs text-(--text-sub)'>
                                        Profile: {selectedApp.profile.title}
                                    </div>
                                </div>
                                <a
                                    href={selectedApp.profile.resumeUrl}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='px-3 py-1.5 border border-(--border-line) text-xs font-mono rounded hover:bg-(--bg-panel) inline-flex items-center gap-1.5 text-(--text-main)'>
                                    Inspect Resume <ExternalLink size={13} />
                                </a>
                            </div>

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
                                    <div className='mb-3 p-2 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded'>
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
                            evidence.
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}
