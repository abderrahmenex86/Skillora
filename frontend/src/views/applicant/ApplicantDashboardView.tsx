import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import {
    AlertCircle,
    Calendar,
    CalendarDays,
    ChevronRight,
    Clock,
    FolderOpen,
    Loader2,
    Video,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatApplicationStatus } from '../../lib/applicationStatus';
import { formatDateTime } from '../../lib/dateTime';

type RescheduleSelection = {
    eventId: string;
    start: string;
    end: string;
};

export default function ApplicantDashboardView() {
    const queryClient = useQueryClient();
    const [rescheduleEventId, setRescheduleEventId] = useState<string | null>(
        null
    );
    const [selectedReschedule, setSelectedReschedule] =
        useState<RescheduleSelection | null>(null);
    const [actionError, setActionError] = useState('');

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

    const {
        data: rescheduleOptions,
        isLoading: optionsLoading,
        error: optionsError,
    } = useQuery({
        queryKey: ['interview-options', rescheduleEventId],
        queryFn: async () => {
            const { data } = await apiClient.get(
                `/applicant/interviews/${rescheduleEventId}/options`
            );
            return data.options;
        },
        enabled: Boolean(rescheduleEventId),
    });

    const refreshAfterAction = () => {
        queryClient.invalidateQueries({ queryKey: ['applicant-calendar'] });
        queryClient.invalidateQueries({ queryKey: ['my-applications'] });
        queryClient.invalidateQueries({ queryKey: ['applicant-messages'] });
    };

    const rescheduleMutation = useMutation({
        mutationFn: async (selection: RescheduleSelection) => {
            const { data } = await apiClient.post(
                `/applicant/interviews/${selection.eventId}/reschedule`,
                {
                    selectedStart: selection.start,
                    selectedEnd: selection.end,
                }
            );
            return data;
        },
        onSuccess: () => {
            refreshAfterAction();
            setRescheduleEventId(null);
            setSelectedReschedule(null);
            setActionError('');
        },
        onError: (error: any) => {
            setActionError(
                error.response?.data?.error ||
                    'Could not reschedule the interview.'
            );
        },
    });

    const declineMutation = useMutation({
        mutationFn: async (eventId: string) => {
            const { data } = await apiClient.post(
                `/applicant/interviews/${eventId}/decline`
            );
            return data;
        },
        onSuccess: () => {
            refreshAfterAction();
            setRescheduleEventId(null);
            setSelectedReschedule(null);
            setActionError('');
        },
        onError: (error: any) => {
            setActionError(
                error.response?.data?.error ||
                    'Could not decline the interview.'
            );
        },
    });

    const handleDecline = (eventId: string) => {
        const confirmed = window.confirm(
            'Decline this interview? Your application will be closed for this position.'
        );
        if (confirmed) {
            declineMutation.mutate(eventId);
        }
    };

    return (
        <div className='flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-5 overflow-y-auto mx-auto px-6 py-6 lg:overflow-hidden'>
            <div className='flex shrink-0 flex-col justify-between gap-4 border-b border-(--border-line) pb-4 sm:flex-row sm:items-center'>
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
                        Explore Jobs
                    </Link>
                </div>
            </div>

            <div className='grid grid-cols-1 items-start gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-12'>
                <section className='flex min-h-0 flex-col rounded-lg border border-(--border-line) bg-(--bg-canvas) lg:col-span-5'>
                    <div className='flex shrink-0 items-center justify-between border-b border-(--border-line) px-6 py-4'>
                        <h3 className='font-grotesque font-bold text-2xl text-(--text-main) flex items-center gap-2'>
                            <Calendar size={20} /> Interview Schedule
                        </h3>
                    </div>

                    <div className='panel-scroll panel-snap flex-1 space-y-4 p-6'>
                        {calLoading ?
                            <div className='flex items-center gap-2 py-4 text-xs text-(--text-sub)'>
                                <Loader2
                                    size={14}
                                    className='animate-spin'
                                />
                                Loading calendar logistics...
                            </div>
                        : calendarData?.length === 0 ?
                            <div className='text-xs text-(--text-sub) py-6 text-center border border-dashed border-(--border-line) rounded-lg'>
                                <CalendarDays
                                    size={40}
                                    strokeWidth={1.25}
                                    className='mx-auto text-(--text-sub)'
                                    aria-hidden='true'
                                />
                                <p className='mt-3'>
                                    No interviews scheduled yet.
                                </p>
                            </div>
                        :   <div className='space-y-4'>
                                {calendarData?.map((event: any) => {
                                    const isConfirmed =
                                        event.status === 'SLOT_CONFIRMED' &&
                                        Boolean(event.confirmedStart);
                                    const isDeclined =
                                        event.status === 'CANCELED';
                                    const isChangingDate =
                                        rescheduleEventId === event.id;

                                    return (
                                        <div
                                            key={event.id}
                                            className={`relative p-4 rounded-md border ${
                                                isDeclined ?
                                                    'border-red-500/30 bg-red-500/5'
                                                : isConfirmed ?
                                                    'border-forest/40 bg-forest/5 dark:bg-forest-dark/5'
                                                :   'border-amber-accent/50 bg-(--bg-canvas)'
                                            }`}>
                                            <span
                                                aria-hidden='true'
                                                className='snap-anchor'
                                            />
                                            <div className='flex justify-between items-start mb-2 gap-3'>
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
                                                        isDeclined ?
                                                            'bg-red-500/10 text-red-600 dark:text-red-400'
                                                        : isConfirmed ?
                                                            'bg-forest/10 text-forest dark:text-forest-dark'
                                                        :   'bg-amber-accent/10 text-amber-accent'
                                                    }`}>
                                                    {isDeclined ?
                                                        'Declined'
                                                    : isConfirmed ?
                                                        'Confirmed'
                                                    :   'Scheduling'}
                                                </span>
                                            </div>

                                            {isDeclined ?
                                                <p className='mt-3 text-xs text-(--text-sub)'>
                                                    You declined this interview
                                                    offer.
                                                </p>
                                            : isConfirmed ?
                                                <>
                                                    <div className='mt-3 text-xs font-mono space-y-1 text-(--text-main)'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <Clock
                                                                size={14}
                                                                className='text-(--text-sub)'
                                                            />
                                                            <span>
                                                                {formatDateTime(
                                                                    event.confirmedStart
                                                                )}
                                                            </span>
                                                        </div>
                                                        {event.meetingLink && (
                                                            <div className='flex items-center gap-1.5 text-forest dark:text-forest-dark'>
                                                                <Video
                                                                    size={14}
                                                                />
                                                                <a
                                                                    href={
                                                                        event.meetingLink
                                                                    }
                                                                    target='_blank'
                                                                    rel='noreferrer'
                                                                    className='underline'>
                                                                    Join Google
                                                                    Meet Room
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className='mt-4 flex flex-wrap gap-2'>
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                setActionError(
                                                                    ''
                                                                );
                                                                setSelectedReschedule(
                                                                    null
                                                                );
                                                                setRescheduleEventId(
                                                                    isChangingDate ?
                                                                        null
                                                                    :   event.id
                                                                );
                                                            }}
                                                            className='inline-flex items-center gap-1.5 rounded-md border border-(--border-line) px-3 py-1.5 text-xs font-semibold text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                                            <CalendarDays
                                                                size={13}
                                                                aria-hidden='true'
                                                            />
                                                            {isChangingDate ?
                                                                'Close'
                                                            :   'Change date'}
                                                        </button>
                                                        <button
                                                            type='button'
                                                            onClick={() =>
                                                                handleDecline(
                                                                    event.id
                                                                )
                                                            }
                                                            disabled={
                                                                declineMutation.isPending
                                                            }
                                                            className='inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400'>
                                                            Decline interview
                                                        </button>
                                                    </div>

                                                    {isChangingDate && (
                                                        <div className='mt-3 rounded-md border border-(--border-line) bg-(--bg-canvas) p-3'>
                                                            <p className='text-xs text-(--text-sub)'>
                                                                Choose another
                                                                slot inside the
                                                                recruiter&apos;s
                                                                interview
                                                                window.
                                                            </p>

                                                            {optionsLoading ?
                                                                <div className='mt-3 flex items-center gap-2 text-xs text-(--text-sub)'>
                                                                    <Loader2
                                                                        size={
                                                                            13
                                                                        }
                                                                        className='animate-spin'
                                                                    />
                                                                    Loading
                                                                    available
                                                                    slots...
                                                                </div>
                                                            : optionsError ?
                                                                <div className='mt-3 flex items-center gap-2 text-xs text-red-600 dark:text-red-400'>
                                                                    <AlertCircle
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                    Could not load
                                                                    alternate
                                                                    slots.
                                                                </div>
                                                            : !rescheduleOptions ||
                                                                  rescheduleOptions.length ===
                                                                      0 ?
                                                                <p className='mt-3 text-xs text-(--text-sub)'>
                                                                    No alternate
                                                                    slots are
                                                                    available.
                                                                </p>
                                                            :   <div className='mt-3 max-h-56 space-y-2 overflow-y-auto'>
                                                                    {rescheduleOptions.map(
                                                                        (
                                                                            option: any
                                                                        ) => {
                                                                            const selected =
                                                                                selectedReschedule?.eventId ===
                                                                                    event.id &&
                                                                                selectedReschedule?.start ===
                                                                                    option.startTime;

                                                                            return (
                                                                                <button
                                                                                    key={
                                                                                        option.startTime
                                                                                    }
                                                                                    type='button'
                                                                                    onClick={() =>
                                                                                        setSelectedReschedule(
                                                                                            {
                                                                                                eventId:
                                                                                                    event.id,
                                                                                                start: option.startTime,
                                                                                                end: option.endTime,
                                                                                            }
                                                                                        )
                                                                                    }
                                                                                    className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left font-mono text-xs transition-colors ${
                                                                                        selected ?
                                                                                            'border-(--text-main) bg-(--bg-panel) ring-1 ring-(--text-main)'
                                                                                        :   'border-(--border-line) hover:border-(--text-sub)'
                                                                                    }`}>
                                                                                    <span>
                                                                                        {formatDateTime(
                                                                                            option.startTime
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
                                                            }

                                                            <button
                                                                type='button'
                                                                onClick={() =>
                                                                    selectedReschedule &&
                                                                    rescheduleMutation.mutate(
                                                                        selectedReschedule
                                                                    )
                                                                }
                                                                disabled={
                                                                    !selectedReschedule ||
                                                                    selectedReschedule.eventId !==
                                                                        event.id ||
                                                                    rescheduleMutation.isPending
                                                                }
                                                                className='mt-3 w-full rounded bg-(--btn-main-bg) py-2 text-xs font-mono uppercase tracking-wider text-(--btn-main-text) hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'>
                                                                {rescheduleMutation.isPending ?
                                                                    'Rescheduling...'
                                                                :   'Confirm new date'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            :   <p className='mt-3 flex items-center gap-2 text-xs text-(--text-sub)'>
                                                    <Clock
                                                        size={14}
                                                        className='text-amber-accent'
                                                    />
                                                    Your interview is being
                                                    assigned. You can reschedule
                                                    or decline once it is
                                                    confirmed.
                                                </p>
                                            }

                                            {actionError && (
                                                <p className='mt-2 text-xs text-red-600 dark:text-red-400'>
                                                    {actionError}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        }
                    </div>
                </section>

                <section className='flex min-h-0 flex-col rounded-lg border border-(--border-line) bg-(--bg-canvas) lg:col-span-7'>
                    <div className='shrink-0 border-b border-(--border-line) px-6 py-4'>
                        <h3 className='font-grotesque font-bold text-2xl text-(--text-main)'>
                            My Active Applications
                        </h3>
                    </div>

                    <div className='panel-scroll panel-snap flex-1 space-y-4 p-6'>
                        {appsLoading ?
                            <div className='flex items-center gap-2 py-4 text-xs text-(--text-sub)'>
                                <Loader2
                                    size={14}
                                    className='animate-spin'
                                />
                                Loading applications...
                            </div>
                        : appsData?.length === 0 ?
                            <div className='text-xs text-(--text-sub) py-8 text-center border border-dashed border-(--border-line) rounded-lg'>
                                <FolderOpen
                                    size={40}
                                    strokeWidth={1.25}
                                    className='mx-auto text-(--text-sub)'
                                    aria-hidden='true'
                                />
                                <div className='mt-3 text-sm font-medium text-(--text-main)'>
                                    No applications yet
                                </div>
                                <p className='mt-1 text-xs text-(--text-sub)'>
                                    Choose a tailored resume and apply to an
                                    open job.
                                </p>
                            </div>
                        :   <div className='space-y-4'>
                                {appsData?.map((app: any) => {
                                    const isRejected =
                                        app.status === 'REJECTED' ||
                                        app.status === 'DECLINED';
                                    const isPositive =
                                        app.status === 'ELIGIBLE' ||
                                        app.status === 'INTERVIEW_PENDING' ||
                                        app.status === 'INTERVIEW_SCHEDULED';
                                    const isOnHold =
                                        app.status === 'ON_HOLD';
                                    const gapAnalysis = app.gapAnalysis;
                                    const feedbackLetter =
                                        gapAnalysis?.letter ??
                                        gapAnalysis?.headlineReason;
                                    const missingQualifications = (
                                        gapAnalysis?.unmetMandatoryReasons ??
                                        []
                                    ).map((reason: string) =>
                                        reason.replace(
                                            /^Missing mandatory requirement:\s*/i,
                                            ''
                                        )
                                    );
                                    const descriptionGaps =
                                        gapAnalysis?.descriptionGaps ?? [];
                                    const experienceNote =
                                        gapAnalysis?.experienceNote;

                                    return (
                                        <div
                                            key={app.id}
                                            className='relative p-5 rounded-md border border-(--border-line) bg-(--bg-canvas) space-y-3'>
                                            <div className='flex justify-between items-start'>
                                                <div>
                                                    <div className='font-mono text-xs text-(--text-sub)'>
                                                        {app.anonymousId} •
                                                        Resume:{' '}
                                                        {app.profile.title}
                                                    </div>
                                                    <h4 className='font-grotesque font-bold text-2xl text-(--text-main)'>
                                                        {app.position.title}
                                                    </h4>
                                                    <div className='text-xs text-(--text-sub)'>
                                                        {
                                                            app.position
                                                                .companyName
                                                        }{' '}
                                                        •{' '}
                                                        {
                                                            app.position
                                                                .location
                                                        }
                                                    </div>
                                                </div>
                                                <span
                                                    className={`font-mono text-xs px-2.5 py-1 rounded border ${
                                                        isRejected ?
                                                            'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                                                        : isPositive ?
                                                            'border-forest/30 bg-forest/10 text-forest dark:text-forest-dark'
                                                        : isOnHold ?
                                                            'border-amber-accent/40 bg-amber-accent/10 text-amber-accent'
                                                        :   'border-(--border-line) bg-(--bg-panel)'
                                                    }`}>
                                                    {formatApplicationStatus(
                                                        app.status
                                                    )}
                                                </span>
                                            </div>

                                            {isOnHold && (
                                                <p className='text-xs text-(--text-sub)'>
                                                    {app.position.status ===
                                                        'OPEN' &&
                                                    new Date(
                                                        app.position.deadline
                                                    ) > new Date() ?
                                                        'You remain shortlisted. We’ll invite you if a seat opens.'
                                                    :   'The position has closed. Your application remains in the talent pool.'}
                                                </p>
                                            )}

                                            {gapAnalysis && (
                                                <div className='mt-4 rounded-lg border border-(--border-line) bg-(--bg-panel) p-5'>
                                                    <p className='font-mono text-[9px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                                        Application feedback
                                                    </p>

                                                    {feedbackLetter && (
                                                        <div className='mt-3 whitespace-pre-line text-sm leading-relaxed text-(--text-main)'>
                                                            {feedbackLetter}
                                                        </div>
                                                    )}

                                                    {missingQualifications.length >
                                                        0 && (
                                                        <div className='mt-4 border-t border-(--border-line) pt-3'>
                                                            <p className='font-mono text-[9px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                                                What was missing
                                                                for this role
                                                            </p>
                                                            <ul className='mt-2 space-y-1 text-xs text-(--text-sub)'>
                                                                {missingQualifications.map(
                                                                    (
                                                                        qualification: string
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                qualification
                                                                            }
                                                                            className='flex gap-2'>
                                                                            <span
                                                                                aria-hidden='true'
                                                                                className='text-amber-accent'>
                                                                                –
                                                                            </span>
                                                                            {
                                                                                qualification
                                                                            }
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {experienceNote && (
                                                        <div className='mt-4 border-t border-(--border-line) pt-3'>
                                                            <p className='font-mono text-[9px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                                                Experience
                                                                signal
                                                            </p>
                                                            <p className='mt-2 text-xs leading-relaxed text-(--text-sub)'>
                                                                {
                                                                    experienceNote
                                                                }
                                                            </p>
                                                        </div>
                                                    )}

                                                    {descriptionGaps.length >
                                                        0 && (
                                                        <div className='mt-4 border-t border-(--border-line) pt-3'>
                                                            <p className='font-mono text-[9px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                                                Description
                                                                alignment
                                                            </p>
                                                            <ul className='mt-2 space-y-1 text-xs text-(--text-sub)'>
                                                                {descriptionGaps.map(
                                                                    (
                                                                        gap: string
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                gap
                                                                            }
                                                                            className='flex gap-2'>
                                                                            <span
                                                                                aria-hidden='true'
                                                                                className='text-amber-accent'>
                                                                                –
                                                                            </span>
                                                                            {
                                                                                gap
                                                                            }
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {gapAnalysis
                                                        .recommendedBridgePath && (
                                                        <div className='mt-4 border-t border-(--border-line) pt-3'>
                                                            <p className='font-mono text-[9px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                                                How to strengthen
                                                                your next
                                                                application
                                                            </p>
                                                            <p className='mt-2 text-sm font-semibold text-(--text-main)'>
                                                                {
                                                                    gapAnalysis
                                                                        .recommendedBridgePath
                                                                        .title
                                                                }
                                                            </p>
                                                            <ul className='mt-2 space-y-1.5 text-xs leading-relaxed text-(--text-sub)'>
                                                                {gapAnalysis
                                                                    .recommendedBridgePath
                                                                    .actionableMilestones?.map(
                                                                        (
                                                                            milestone: string
                                                                        ) => (
                                                                            <li
                                                                                key={
                                                                                    milestone
                                                                                }
                                                                                className='flex gap-2'>
                                                                                <span
                                                                                    aria-hidden='true'
                                                                                    className='mt-1 h-1 w-1 shrink-0 rounded-full bg-forest dark:bg-forest-dark'
                                                                                />
                                                                                {
                                                                                    milestone
                                                                                }
                                                                            </li>
                                                                        )
                                                                    )}
                                                            </ul>
                                                            {gapAnalysis
                                                                .recommendedBridgePath
                                                                .reapplicationReadinessMilestone && (
                                                                <p className='mt-3 rounded-md border border-(--border-line) bg-(--bg-canvas) p-3 text-xs leading-relaxed text-(--text-sub)'>
                                                                    <span className='font-semibold text-(--text-main)'>
                                                                        Before
                                                                        re-applying:{' '}
                                                                    </span>
                                                                    {
                                                                        gapAnalysis
                                                                            .recommendedBridgePath
                                                                            .reapplicationReadinessMilestone
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <span
                                                aria-hidden='true'
                                                className='snap-anchor'
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        }
                    </div>
                </section>
            </div>
        </div>
    );
}
