import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { Link } from 'react-router-dom';
import {
    AlertTriangle,
    Plus,
    Users,
    Clock,
    ArrowRight,
    FolderOpen,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { formatDate } from '../../lib/dateTime';

export default function RecruiterPositionsView() {
    const user = useAuthStore((state) => state.user);
    const isFrozen = user?.companyStatus === 'FROZEN';
    const { data: positions, isLoading } = useQuery({
        queryKey: ['recruiter-positions'],
        queryFn: async () => {
            const { data } = await apiClient.get('/recruiter/positions');
            return data.positions;
        },
    });

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
                {isFrozen ? (
                    <span className='px-4 py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-sm font-medium rounded-md opacity-50 inline-flex items-center gap-2 cursor-not-allowed'>
                        <Plus size={16} /> Open New Position
                    </span>
                ) : (
                    <Link
                        to='/recruiter/positions/new'
                        className='px-4 py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-sm font-medium rounded-md hover:opacity-90 inline-flex items-center gap-2'>
                        <Plus size={16} /> Open New Position
                    </Link>
                )}
            </div>

            {isFrozen && (
                <div className='flex items-start gap-3 rounded-lg border border-amber-accent/30 bg-amber-accent/5 p-4'>
                    <AlertTriangle
                        size={18}
                        className='mt-0.5 shrink-0 text-amber-accent'
                    />
                    <p className='text-xs leading-relaxed text-(--text-sub)'>
                        Your company is frozen. You can review positions and
                        candidates, but creating, editing, and pipeline actions
                        are disabled.
                    </p>
                </div>
            )}

            {isLoading ?
                <div className='text-xs text-(--text-sub)'>
                    Loading position pipelines...
                </div>
            :   <div className='grid min-h-0 items-start gap-6 lg:flex-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
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
                                                    `${formatDate(
                                                        p.interviewRangeStart
                                                    )} – ${formatDate(
                                                        p.interviewRangeEnd
                                                    )}`
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
                                                    {formatDate(p.deadline)}
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
                                                {formatDate(p.deadline)}
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
