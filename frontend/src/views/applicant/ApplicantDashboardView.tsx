import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import {
    Calendar,
    Video,
    Clock,
    CheckCircle2,
    ChevronRight,
    AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ApplicantDashboardView() {
    const queryClient = useQueryClient();
    const [selectedSlot, setSelectedSlot] = useState<{
        eventId: string;
        start: string;
        end: string;
    } | null>(null);

    const { data: calendarData, isLoading: calLoading } = useQuery({
        queryKey: ['applicant-calendar'],
        queryFn: async () => {
            const { data } = await apiClient.get('/applicant/calendar');
            return data.events;
        },
    });

    const { data: appsData, isLoading: appsLoading } = useQuery({
        queryKey: ['my-applications'],
        queryFn: async () => {
            const { data } = await apiClient.get('/applicant/applications');
            return data.applications;
        },
    });

    const selectRangeMutation = useMutation({
        mutationFn: async ({
            eventId,
            start,
            end,
        }: {
            eventId: string;
            start: string;
            end: string;
        }) => {
            const { data } = await apiClient.post(
                '/applicant/interviews/select-range',
                {
                    interviewEventId: eventId,
                    selectedStart: start,
                    selectedEnd: end,
                }
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applicant-calendar'] });
            queryClient.invalidateQueries({ queryKey: ['my-applications'] });
            setSelectedSlot(null);
        },
    });

    return (
        <div className='flex-1 max-w-7xl w-full mx-auto px-6 py-8'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-(--border-line) pb-6'>
                <div>
                    <h1 className='font-grotesque font-extrabold text-4xl text-(--text-main) tracking-tight'>
                        Dashboard & Interview Logistics
                    </h1>
                </div>
                <div className='flex items-center gap-3'>
                    <Link
                        to='/applicant/profiles'
                        className='px-4 py-2 border border-(--border-line) text-sm font-medium rounded-md hover:bg-(--bg-panel) text-(--text-main)'>
                        Manage Resumes
                    </Link>
                    <Link
                        to='/jobs'
                        className='px-4 py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-sm font-medium rounded-md hover:opacity-90'>
                        Explore Open Roles
                    </Link>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
                <div className='lg:col-span-5 space-y-6'>
                    <div className='border border-(--border-line) rounded-lg p-6 bg-(--bg-canvas)'>
                        <div className='flex items-center justify-between mb-4'>
                            <h3 className='font-grotesque font-bold text-2xl text-(--text-main) flex items-center gap-2'>
                                <Calendar size={20} /> Interview Schedule
                            </h3>
                            <span className='font-mono text-xs text-(--text-sub)'>
                                AGENT DISPATCH
                            </span>
                        </div>

                        {calLoading ?
                            <div className='text-xs text-(--text-sub) py-4'>
                                Loading calendar logistics...
                            </div>
                        : calendarData?.length === 0 ?
                            <div className='text-xs text-(--text-sub) py-6 text-center border border-dashed border-(--border-line) rounded'>
                                No active interview slots pending or scheduled.
                            </div>
                        :   <div className='space-y-4'>
                                {calendarData?.map((event: any) => {
                                    const isConfirmed =
                                        event.status === 'SLOT_CONFIRMED';
                                    return (
                                        <div
                                            key={event.id}
                                            className={`p-4 rounded-md border ${
                                                isConfirmed ?
                                                    'border-forest/40 bg-forest/5 dark:bg-forest-dark/5'
                                                :   'border-amber-accent/50 bg-(--bg-canvas)'
                                            }`}>
                                            <div className='flex justify-between items-start mb-2'>
                                                <div>
                                                    <div className='font-mono text-[10px] text-(--text-sub)'>
                                                        {
                                                            event.application
                                                                .anonymousId
                                                        }{' '}
                                                        •{' '}
                                                        {
                                                            event.application
                                                                .position
                                                                .companyName
                                                        }
                                                    </div>
                                                    <h4 className='font-grotesque font-bold text-xl text-(--text-main)'>
                                                        {
                                                            event.application
                                                                .position.title
                                                        }
                                                    </h4>
                                                </div>
                                                <span
                                                    className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase ${
                                                        isConfirmed ?
                                                            'bg-forest/10 text-forest dark:text-forest-dark'
                                                        :   'bg-amber-accent/10 text-amber-accent'
                                                    }`}>
                                                    {isConfirmed ?
                                                        'Confirmed'
                                                    :   'Select Range'}
                                                </span>
                                            </div>

                                            {isConfirmed ?
                                                <div className='mt-3 text-xs font-mono space-y-1 text-(--text-main)'>
                                                    <div className='flex items-center gap-1.5'>
                                                        <Clock
                                                            size={14}
                                                            className='text-(--text-sub)'
                                                        />
                                                        <span>
                                                            {new Date(
                                                                event.confirmedStart
                                                            ).toLocaleString(
                                                                [],
                                                                {
                                                                    dateStyle:
                                                                        'medium',
                                                                    timeStyle:
                                                                        'short',
                                                                }
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className='flex items-center gap-1.5 text-forest dark:text-forest-dark'>
                                                        <Video size={14} />
                                                        <a
                                                            href={
                                                                event.meetingLink
                                                            }
                                                            target='_blank'
                                                            rel='noreferrer'
                                                            className='underline'>
                                                            Join Google Meet
                                                            Room
                                                        </a>
                                                    </div>
                                                </div>
                                            :   <div className='mt-3'>
                                                    <p className='text-xs text-(--text-sub) mb-2'>
                                                        The logistics agent
                                                        proposed the following
                                                        interview ranges:
                                                    </p>
                                                    <div className='space-y-2'>
                                                        {event.proposedRanges?.map(
                                                            (
                                                                slot: any,
                                                                idx: number
                                                            ) => {
                                                                const start =
                                                                    new Date(
                                                                        slot.startTime
                                                                    );
                                                                const end =
                                                                    new Date(
                                                                        slot.endTime
                                                                    );
                                                                const isSelected =
                                                                    selectedSlot?.start ===
                                                                        slot.startTime &&
                                                                    selectedSlot?.eventId ===
                                                                        event.id;

                                                                return (
                                                                    <button
                                                                        key={
                                                                            idx
                                                                        }
                                                                        type='button'
                                                                        onClick={() =>
                                                                            setSelectedSlot(
                                                                                {
                                                                                    eventId:
                                                                                        event.id,
                                                                                    start: slot.startTime,
                                                                                    end: slot.endTime,
                                                                                }
                                                                            )
                                                                        }
                                                                        className={`w-full text-left px-3 py-2 rounded text-xs font-mono border transition-all flex justify-between items-center ${
                                                                            (
                                                                                isSelected
                                                                            ) ?
                                                                                'border-(--text-main) bg-(--bg-panel) ring-1 ring-(--text-main)'
                                                                            :   'border-(--border-line) hover:border-(--text-sub)'
                                                                        }`}>
                                                                        <span>
                                                                            {start.toLocaleString(
                                                                                [],
                                                                                {
                                                                                    weekday:
                                                                                        'short',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                }
                                                                            )}{' '}
                                                                            –{' '}
                                                                            {end.toLocaleTimeString(
                                                                                [],
                                                                                {
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                }
                                                                            )}
                                                                        </span>
                                                                        <ChevronRight
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    </button>
                                                                );
                                                            }
                                                        )}
                                                    </div>

                                                    {selectedSlot?.eventId ===
                                                        event.id && (
                                                        <button
                                                            type='button'
                                                            onClick={() =>
                                                                selectRangeMutation.mutate(
                                                                    selectedSlot
                                                                )
                                                            }
                                                            disabled={
                                                                selectRangeMutation.isPending
                                                            }
                                                            className='mt-3 w-full py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-mono uppercase tracking-wider rounded font-semibold hover:opacity-90'>
                                                            {(
                                                                selectRangeMutation.isPending
                                                            ) ?
                                                                'Locking Slot...'
                                                            :   'Confirm Selected Slot'
                                                            }
                                                        </button>
                                                    )}
                                                </div>
                                            }
                                        </div>
                                    );
                                })}
                            </div>
                        }
                    </div>
                </div>

                <div className='lg:col-span-7 space-y-6'>
                    <div className='border border-(--border-line) rounded-lg p-6 bg-(--bg-canvas)'>
                        <h3 className='font-grotesque font-bold text-2xl text-(--text-main) mb-4'>
                            My Active Applications
                        </h3>

                        {appsLoading ?
                            <div className='text-xs text-(--text-sub) py-4'>
                                Loading applications...
                            </div>
                        : appsData?.length === 0 ?
                            <div className='text-xs text-(--text-sub) py-8 text-center border border-dashed border-(--border-line) rounded'>
                                You haven't submitted any applications yet.
                            </div>
                        :   <div className='space-y-4'>
                                {appsData?.map((app: any) => (
                                    <div
                                        key={app.id}
                                        className='p-5 rounded-md border border-(--border-line) bg-(--bg-canvas) space-y-3'>
                                        <div className='flex justify-between items-start'>
                                            <div>
                                                <div className='font-mono text-xs text-(--text-sub)'>
                                                    {app.anonymousId} • Resume:{' '}
                                                    {app.profile.title}
                                                </div>
                                                <h4 className='font-grotesque font-bold text-2xl text-(--text-main)'>
                                                    {app.position.title}
                                                </h4>
                                                <div className='text-xs text-(--text-sub)'>
                                                    {app.position.companyName} •{' '}
                                                    {app.position.location}
                                                </div>
                                            </div>
                                            <span className='font-mono text-xs px-2.5 py-1 rounded border border-(--border-line) bg-(--bg-panel)'>
                                                {app.status}
                                            </span>
                                        </div>

                                        {app.gapAnalysis && (
                                            <div className='mt-4 p-4 border-2 border-amber-accent rounded-md bg-(--bg-canvas)'>
                                                <span className='font-mono text-[10px] text-amber-accent border border-amber-accent/40 px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-2'>
                                                    {app.gapAnalysis.badge}
                                                </span>
                                                <div className='text-xs text-(--text-main) font-medium mb-1'>
                                                    {
                                                        app.gapAnalysis
                                                            .headlineReason
                                                    }
                                                </div>
                                                <div className='bg-(--bg-panel) p-3 rounded text-xs text-(--text-sub) mt-2'>
                                                    <span className='font-semibold text-(--text-main) block mb-0.5'>
                                                        Recommended Bridge Path:
                                                    </span>
                                                    {
                                                        app.gapAnalysis
                                                            .recommendedBridgePath
                                                            ?.title
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
