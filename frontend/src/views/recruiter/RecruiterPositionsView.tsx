import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { Link } from 'react-router-dom';
import { Plus, Users, Clock, ArrowRight, FolderOpen } from 'lucide-react';

export default function RecruiterPositionsView() {
    const queryClient = useQueryClient();
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [companyName, setCompanyName] = useState('');
    const [title, setTitle] = useState('');
    const [department, setDepartment] = useState('');
    const [location, setLocation] = useState('Algiers (Hybrid)');
    const [deadline, setDeadline] = useState('');
    const [interviewCapacity, setInterviewCapacity] = useState('10');
    const [interviewRangeStart, setInterviewRangeStart] = useState('');
    const [interviewRangeEnd, setInterviewRangeEnd] = useState('');
    const [formError, setFormError] = useState('');
    const [criteriaStr, setCriteriaStr] = useState('');

    const { data: positions, isLoading } = useQuery({
        queryKey: ['recruiter-positions'],
        queryFn: async () => {
            const { data } = await apiClient.get('/recruiter/positions');
            return data.positions;
        },
    });

    const createPositionMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await apiClient.post(
                '/recruiter/positions',
                payload
            );
            return data.position;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['recruiter-positions'],
            });
            setShowCreateModal(false);
            setCompanyName('');
            setTitle('');
            setDepartment('');
            setDeadline('');
            setInterviewCapacity('10');
            setInterviewRangeStart('');
            setInterviewRangeEnd('');
            setCriteriaStr('');
            setFormError('');
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        const mandatoryCriteria = criteriaStr
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);

        if (!deadline || !interviewRangeStart || !interviewRangeEnd) {
            setFormError(
                'Application deadline and interview range are required.'
            );
            return;
        }

        const deadlineDate = new Date(deadline);
        const rangeStart = new Date(interviewRangeStart);
        const rangeEnd = new Date(interviewRangeEnd);
        const capacity = Number(interviewCapacity);

        if (rangeStart < deadlineDate) {
            setFormError(
                'Interviews cannot start before applications close.'
            );
            return;
        }

        if (rangeEnd <= rangeStart) {
            setFormError('The interview range must end after it starts.');
            return;
        }

        if (!Number.isInteger(capacity) || capacity < 1) {
            setFormError('Interview capacity must be at least 1.');
            return;
        }

        createPositionMutation.mutate({
            companyName,
            title,
            department,
            location,
            deadline: deadlineDate.toISOString(),
            interviewCapacity: capacity,
            interviewRangeStart: rangeStart.toISOString(),
            interviewRangeEnd: rangeEnd.toISOString(),
            rubric: {
                mandatoryCriteria,
                preferredCriteria: [],
                minimumScoreThreshold: 70,
            },
        });
    };

    const now = new Date();
    const openPositions = positions?.filter(
        (p: any) => p.status === 'OPEN' && new Date(p.deadline) > now
    );
    const closedPositions = positions?.filter(
        (p: any) => p.status === 'CLOSED' || new Date(p.deadline) <= now
    );

    return (
        <div className='flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-5 overflow-y-auto mx-auto px-6 py-6 lg:overflow-hidden'>
            <div className='flex shrink-0 flex-col justify-between gap-3 border-b border-(--border-line) pb-4 sm:flex-row sm:items-center'>
                <div>
                    <h1 className='font-grotesque font-extrabold text-4xl text-(--text-main) tracking-tight'>
                        Positions History
                    </h1>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className='px-4 py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-sm font-medium rounded-md hover:opacity-90 inline-flex items-center gap-2'>
                    <Plus size={16} /> Open New Position
                </button>
            </div>

            {showCreateModal && (
                <div className='modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
                    <div className='modal-panel bg-(--bg-canvas) border border-(--border-line) rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4'>
                        <h3 className='font-grotesque font-bold text-2xl text-(--text-main)'>
                            Create Verifiable Position
                        </h3>
                        <form
                            onSubmit={handleCreate}
                            className='space-y-3'>
                            <input
                                type='text'
                                required
                                placeholder='Company Name (e.g. Sonatrach, TechCorp DZ)'
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                            />
                            <input
                                type='text'
                                required
                                placeholder='Job Title (e.g. Junior Cloud Engineer, Corporate Counsel)'
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                            />
                            <input
                                type='text'
                                required
                                placeholder='Department (e.g. Cloud & Systems, Legal Affairs)'
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                            />
                            <input
                                type='text'
                                required
                                placeholder='Location (e.g. Algiers Hybrid, Oran)'
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                            />
                            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                                <label className='block'>
                                    <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                        Applications close
                                    </span>
                                    <input
                                        type='datetime-local'
                                        required
                                        value={deadline}
                                        onChange={(e) =>
                                            setDeadline(e.target.value)
                                        }
                                        className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                                    />
                                </label>
                                <label className='block'>
                                    <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                        Interview capacity
                                    </span>
                                    <input
                                        type='number'
                                        min={1}
                                        max={500}
                                        required
                                        value={interviewCapacity}
                                        onChange={(e) =>
                                            setInterviewCapacity(
                                                e.target.value
                                            )
                                        }
                                        className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                                    />
                                </label>
                                <label className='block'>
                                    <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                        Interviews from
                                    </span>
                                    <input
                                        type='datetime-local'
                                        required
                                        value={interviewRangeStart}
                                        onChange={(e) =>
                                            setInterviewRangeStart(
                                                e.target.value
                                            )
                                        }
                                        className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                                    />
                                </label>
                                <label className='block'>
                                    <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                        Interviews until
                                    </span>
                                    <input
                                        type='datetime-local'
                                        required
                                        value={interviewRangeEnd}
                                        onChange={(e) =>
                                            setInterviewRangeEnd(
                                                e.target.value
                                            )
                                        }
                                        className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                                    />
                                </label>
                            </div>

                            {formError && (
                                <p
                                    role='alert'
                                    className='text-xs text-red-600 dark:text-red-400'>
                                    {formError}
                                </p>
                            )}

                            <textarea
                                rows={2}
                                required
                                placeholder='Mandatory Rubric Criteria (comma-separated: Docker, Linux, CI/CD)'
                                value={criteriaStr}
                                onChange={(e) => setCriteriaStr(e.target.value)}
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                            />

                            <div className='flex justify-end gap-2 pt-2'>
                                <button
                                    type='button'
                                    onClick={() => setShowCreateModal(false)}
                                    className='px-4 py-2 border border-(--border-line) text-xs font-semibold rounded'>
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    disabled={createPositionMutation.isPending}
                                    className='px-4 py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-semibold rounded hover:opacity-90'>
                                    Create Opening
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isLoading ?
                <div className='text-xs text-(--text-sub)'>
                    Loading position pipelines...
                </div>
            :   <div className='grid min-h-0 gap-6 lg:flex-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
                    <section className='flex min-h-0 flex-col'>
                        <h3 className='mb-3 flex shrink-0 items-center gap-2 font-grotesque font-bold text-2xl text-(--text-main)'>
                            <span className='w-2 h-2 rounded-full bg-forest dark:bg-forest-dark' />{' '}
                            Active & Open Pipelines (
                            {openPositions?.length ?? 0})
                        </h3>

                        <div className='panel-scroll panel-snap flex-1 min-h-0'>
                        {openPositions?.length === 0 ?
                            <div className='p-8 border border-dashed border-(--border-line) text-center rounded-lg'>
                                <FolderOpen
                                    size={40}
                                    strokeWidth={1.25}
                                    className='mx-auto text-(--text-sub)'
                                    aria-hidden='true'
                                />
                                <div className='mt-3 text-sm font-medium text-(--text-main)'>
                                    No active openings
                                </div>
                                <p className='mt-1 text-xs text-(--text-sub)'>
                                    Click "Open New Position" above to launch a
                                    pipeline.
                                </p>
                            </div>
                        :   <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                {openPositions?.map((p: any) => (
                                    <Link
                                        key={p.id}
                                        to={`/recruiter/positions/${p.id}/applications`}
                                        className='relative p-5 rounded-md border border-(--border-line) bg-(--bg-canvas) hover:border-(--text-main) transition-all block group'>
                                        <span
                                            aria-hidden='true'
                                            className='snap-anchor'
                                        />
                                        <div className='flex justify-between items-start mb-2'>
                                            <div>
                                                <span className='font-mono text-[10px] text-(--text-sub) uppercase'>
                                                    {p.department} •{' '}
                                                    {p.location}
                                                </span>
                                                <h4 className='font-grotesque font-bold text-2xl text-(--text-main) group-hover:text-forest dark:group-hover:text-forest-dark transition-colors'>
                                                    {p.title}
                                                </h4>
                                            </div>
                                            <ArrowRight
                                                size={18}
                                                className='text-(--text-sub) group-hover:text-(--text-main)'
                                            />
                                        </div>

                                        <div className='mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-(--border-line) pt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-(--text-sub)'>
                                            <span>
                                                {p.interviewCapacity ??
                                                    '—'}{' '}
                                                interview seats
                                            </span>
                                            <span>
                                                {p.interviewRangeStart &&
                                                p.interviewRangeEnd ?
                                                    `${new Date(
                                                        p.interviewRangeStart
                                                    ).toLocaleDateString()} – ${new Date(
                                                        p.interviewRangeEnd
                                                    ).toLocaleDateString()}`
                                                :   'Interview range not set'}
                                            </span>
                                        </div>

                                        <div className='flex items-center justify-between pt-3 border-t border-(--border-line) text-xs font-mono text-(--text-sub)'>
                                            <div className='flex items-center gap-1.5'>
                                                <Users size={14} />
                                                <span>
                                                    {p._count?.applications ??
                                                        0}{' '}
                                                    Submissions
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-1.5 text-amber-accent'>
                                                <Clock size={14} />
                                                <span>
                                                    Deadline:{' '}
                                                    {new Date(
                                                        p.deadline
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        }
                        </div>
                    </section>

                    <section className='flex min-h-0 flex-col'>
                        <h3 className='mb-3 shrink-0 font-grotesque font-bold text-2xl text-(--text-sub)'>
                            Archived & Closed Positions (
                            {closedPositions?.length ?? 0})
                        </h3>
                        <div className='panel-scroll panel-snap flex-1 min-h-0'>
                        {closedPositions?.length > 0 ?
                            <div className='space-y-3 opacity-80'>
                                {closedPositions.map((p: any) => (
                                    <Link
                                        key={p.id}
                                        to={`/recruiter/positions/${p.id}/applications`}
                                        className='relative block rounded-md border border-(--border-line) bg-(--bg-panel) p-4 transition-colors hover:border-(--text-sub)'>
                                        <span
                                            aria-hidden='true'
                                            className='snap-anchor'
                                        />
                                        <div className='flex items-start justify-between gap-3'>
                                            <div className='min-w-0'>
                                                <span className='font-mono text-[10px] uppercase tracking-[0.08em] text-(--text-sub)'>
                                                    CLOSED • {p.department}
                                                </span>
                                                <h4 className='mt-1 break-words font-grotesque text-xl font-bold leading-tight text-(--text-main)'>
                                                    {p.title}
                                                </h4>
                                                <p className='mt-1 font-mono text-[10px] text-(--text-sub)'>
                                                    {p.location}
                                                </p>
                                            </div>
                                            <span className='shrink-0 rounded bg-(--border-line) px-2 py-0.5 font-mono text-[10px] text-(--text-sub)'>
                                                LOCKED
                                            </span>
                                        </div>
                                        <div className='mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-(--border-line) pt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-(--text-sub)'>
                                            <span>
                                                {p._count?.applications ?? 0}{' '}
                                                applications
                                            </span>
                                            <span>
                                                Closed{' '}
                                                {new Date(
                                                    p.deadline
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        :   <div className='rounded-md border border-dashed border-(--border-line) px-4 py-8 text-center text-xs text-(--text-sub)'>
                                No archived positions yet.
                            </div>
                        }
                        </div>
                    </section>
                </div>
            }
        </div>
    );
}
