import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    CalendarDays,
    Check,
    Loader2,
    Send,
} from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { DateCalendar, TimeField } from '../../components/DateCalendar';
import {
    parseAlgeriaDateTime,
    toAlgeriaDateTimeLocal,
} from '../../lib/dateTime';

type Company = {
    id: string;
    name: string;
    status: string;
    departments: Array<{ id: string; name: string; isActive: boolean }>;
    branches: Array<{
        id: string;
        label: string;
        wilaya: string;
        isActive: boolean;
    }>;
};

function errorMessage(error: any) {
    const data = error?.response?.data;
    if (Array.isArray(data?.issues) && data.issues.length > 0) {
        return data.issues
            .map((issue: { message?: string }) => issue.message)
            .filter(Boolean)
            .join(' • ');
    }

    return (
        data?.error ||
        error?.message ||
        'Something went wrong. Please try again.'
    );
}

function todayInAlgeria() {
    return toAlgeriaDateTimeLocal(new Date()).slice(0, 10);
}

export default function NewPositionView() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: company, isLoading } = useQuery({
        queryKey: ['my-company'],
        queryFn: async () => {
            const { data } = await apiClient.get('/recruiter/company');
            return data.company as Company;
        },
    });

    const [title, setTitle] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [branchId, setBranchId] = useState('');
    const [description, setDescription] = useState('');
    const [minimumYears, setMinimumYears] = useState('');
    const [capacity, setCapacity] = useState('3');
    const [criteria, setCriteria] = useState('');
    const [preferred, setPreferred] = useState('');
    const [deadlineDate, setDeadlineDate] = useState('');
    const [deadlineTime, setDeadlineTime] = useState('18:00');
    const [fromDate, setFromDate] = useState('');
    const [fromTime, setFromTime] = useState('09:00');
    const [untilDate, setUntilDate] = useState('');
    const [untilTime, setUntilTime] = useState('17:00');
    const [formError, setFormError] = useState('');

    const activeDepartments =
        company?.departments.filter((department) => department.isActive) ?? [];
    const activeBranches =
        company?.branches.filter((branch) => branch.isActive) ?? [];

    useEffect(() => {
        if (activeDepartments.length > 0 && !departmentId) {
            setDepartmentId(activeDepartments[0].id);
        }
    }, [activeDepartments, departmentId]);

    useEffect(() => {
        if (activeBranches.length > 0 && !branchId) {
            setBranchId(activeBranches[0].id);
        }
    }, [activeBranches, branchId]);

    const createPosition = useMutation({
        mutationFn: async () => {
            const deadline = parseAlgeriaDateTime(
                `${deadlineDate}T${deadlineTime}`
            );
            const rangeStart = parseAlgeriaDateTime(
                `${fromDate}T${fromTime}`
            );
            const rangeEnd = parseAlgeriaDateTime(
                `${untilDate}T${untilTime}`
            );

            if (!deadline || !rangeStart || !rangeEnd) {
                throw new Error('Choose all three dates and times.');
            }

            if (!title.trim() || title.trim().length < 2) {
                throw new Error('Add a job title.');
            }
            if (description.trim().length < 40) {
                throw new Error(
                    'Add a job description of at least 40 characters.'
                );
            }
            if (!departmentId || !branchId) {
                throw new Error('Choose a department and branch.');
            }

            const mandatoryCriteria = criteria
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
            if (mandatoryCriteria.length === 0) {
                throw new Error('Add at least one mandatory criterion.');
            }

            if (rangeStart < deadline) {
                throw new Error(
                    'Interviews cannot start before applications close.'
                );
            }
            if (rangeEnd <= rangeStart) {
                throw new Error(
                    'The interview window must end after it starts.'
                );
            }

            const capacityNumber = Number(capacity);
            if (
                !Number.isInteger(capacityNumber) ||
                capacityNumber < 1
            ) {
                throw new Error('Interview capacity must be at least 1.');
            }

            const { data } = await apiClient.post('/recruiter/positions', {
                title: title.trim(),
                departmentId,
                branchId,
                description: description.trim(),
                minimumYearsExperience: minimumYears
                    ? Number(minimumYears)
                    : undefined,
                deadline: deadline.toISOString(),
                interviewCapacity: capacityNumber,
                interviewRangeStart: rangeStart.toISOString(),
                interviewRangeEnd: rangeEnd.toISOString(),
                rubric: {
                    mandatoryCriteria,
                    preferredCriteria: preferred
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                },
            });
            return data.position;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['recruiter-positions'],
            });
            navigate('/recruiter/positions');
        },
        onError: (mutationError) => {
            setFormError(errorMessage(mutationError));
        },
    });

    if (isLoading) {
        return (
            <div className='page-scroll flex items-center justify-center'>
                <Loader2 className='animate-spin text-(--text-sub)' />
            </div>
        );
    }

    if (!company || company.status !== 'APPROVED') {
        return (
            <div className='page-scroll flex items-center justify-center px-6'>
                <div className='max-w-md rounded-lg border border-(--border-line) bg-(--bg-panel) p-6 text-center'>
                    <AlertTriangle className='mx-auto text-amber-accent' />
                    <p className='mt-3 text-sm text-(--text-main)'>
                        Your company must be approved before publishing a
                        position.
                    </p>
                    <Link
                        to='/recruiter/onboarding'
                        className='mt-4 inline-block text-xs font-semibold text-(--text-main) underline'>
                        Review company profile
                    </Link>
                </div>
            </div>
        );
    }

    if (activeDepartments.length === 0 || activeBranches.length === 0) {
        return (
            <div className='page-scroll flex items-center justify-center px-6'>
                <div className='max-w-md rounded-lg border border-(--border-line) bg-(--bg-panel) p-6 text-center'>
                    <Building2 className='mx-auto text-amber-accent' />
                    <p className='mt-3 text-sm text-(--text-main)'>
                        Add at least one active department and branch before
                        publishing a position.
                    </p>
                    <Link
                        to='/recruiter/onboarding'
                        className='mt-4 inline-block text-xs font-semibold text-(--text-main) underline'>
                        Update company profile
                    </Link>
                </div>
            </div>
        );
    }

    const minimumDeadline = todayInAlgeria();
    const minimumFrom = deadlineDate || minimumDeadline;
    const minimumUntil = fromDate || deadlineDate || minimumDeadline;

    return (
        <div className='page-scroll'>
            <div className='mx-auto w-full max-w-5xl px-4 py-6 sm:px-6'>
                <Link
                    to='/recruiter/positions'
                    className='inline-flex items-center gap-1.5 text-xs font-mono text-(--text-sub) transition-colors hover:text-(--text-main)'>
                    <ArrowLeft size={14} /> Back to positions
                </Link>

                <div className='mt-3 border-b border-(--border-line) pb-5'>
                    <p className='font-mono text-[10px] uppercase tracking-[0.18em] text-(--text-sub)'>
                        New position
                    </p>
                    <h1 className='mt-1 font-grotesque text-4xl font-extrabold tracking-tight text-(--text-main)'>
                        Publish a role
                    </h1>
                    <p className='mt-1 text-sm text-(--text-sub)'>
                        Define the evidence, the work, and the interview window.
                        Skillora will evaluate every application against both
                        the rubric and the job description.
                    </p>
                </div>

                {formError && (
                    <div className='mt-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400'>
                        {formError}
                    </div>
                )}

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        setFormError('');
                        createPosition.mutate();
                    }}
                    className='mt-6 space-y-6'>
                    <section className='rounded-lg border border-(--border-line) bg-(--bg-canvas) p-5'>
                        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-(--border-line) pb-3'>
                            <div className='flex items-center gap-2'>
                                <Building2
                                    size={16}
                                    className='text-(--text-sub)'
                                />
                                <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                                    Company context
                                </h2>
                            </div>
                            <span className='inline-flex items-center gap-1.5 rounded border border-forest/30 bg-forest/5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-forest dark:text-forest-dark'>
                                <Check size={11} /> {company.name}
                            </span>
                        </div>
                        <p className='mt-2 text-xs text-(--text-sub)'>
                            The company is fixed to your approved profile. The
                            department and branch come from your company
                            settings.{' '}
                            <Link
                                to='/recruiter/onboarding'
                                className='font-semibold text-(--text-main) underline'>
                                Manage company settings
                            </Link>
                        </p>
                        <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                            <label className='block'>
                                <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Department
                                </span>
                                <select
                                    value={departmentId}
                                    onChange={(event) =>
                                        setDepartmentId(event.target.value)
                                    }
                                    required
                                    className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm text-(--text-main)'>
                                    {activeDepartments.map((department) => (
                                        <option
                                            key={department.id}
                                            value={department.id}>
                                            {department.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className='block'>
                                <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Branch
                                </span>
                                <select
                                    value={branchId}
                                    onChange={(event) =>
                                        setBranchId(event.target.value)
                                    }
                                    required
                                    className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm text-(--text-main)'>
                                    {activeBranches.map((branch) => (
                                        <option
                                            key={branch.id}
                                            value={branch.id}>
                                            {branch.label} · {branch.wilaya}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </section>

                    <section className='rounded-lg border border-(--border-line) bg-(--bg-canvas) p-5'>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Role and description
                        </h2>
                        <div className='mt-4 space-y-4'>
                            <label className='block'>
                                <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Job title
                                </span>
                                <input
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
                                    required
                                    placeholder='e.g. Senior Platform Engineer'
                                    className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm text-(--text-main)'
                                />
                            </label>
                            <label className='block'>
                                <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Job description (mandatory)
                                </span>
                                <textarea
                                    rows={6}
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                    required
                                    placeholder='Describe the mission, responsibilities, and the kind of evidence you expect. The matcher evaluates candidates against this description.'
                                    className='w-full resize-y rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm leading-relaxed text-(--text-main)'
                                />
                                <span className='mt-1 block text-[10px] text-(--text-sub)'>
                                    At least 40 characters. The description is
                                    scored alongside the rubric.
                                </span>
                            </label>
                            <label className='block sm:max-w-xs'>
                                <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Preferred proven experience (years)
                                </span>
                                <input
                                    type='number'
                                    min={0}
                                    max={50}
                                    value={minimumYears}
                                    onChange={(event) =>
                                        setMinimumYears(event.target.value)
                                    }
                                    placeholder='e.g. 5 (soft preference)'
                                    className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm text-(--text-main)'
                                />
                                <span className='mt-1 block text-[10px] text-(--text-sub)'>
                                    Soft signal only; a strong portfolio can
                                    compensate.
                                </span>
                            </label>
                        </div>
                    </section>

                    <section className='rounded-lg border border-(--border-line) bg-(--bg-canvas) p-5'>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Evidence rubric
                        </h2>
                        <div className='mt-4 space-y-4'>
                            <label className='block'>
                                <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Mandatory criteria (comma-separated)
                                </span>
                                <textarea
                                    rows={3}
                                    value={criteria}
                                    onChange={(event) =>
                                        setCriteria(event.target.value)
                                    }
                                    required
                                    placeholder='Docker, Linux, CI/CD'
                                    className='w-full resize-y rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm text-(--text-main)'
                                />
                            </label>
                            <label className='block'>
                                <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Preferred criteria (optional)
                                </span>
                                <textarea
                                    rows={2}
                                    value={preferred}
                                    onChange={(event) =>
                                        setPreferred(event.target.value)
                                    }
                                    placeholder='Kubernetes, Go'
                                    className='w-full resize-y rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm text-(--text-main)'
                                />
                            </label>
                        </div>
                    </section>

                    <section className='rounded-lg border border-(--border-line) bg-(--bg-canvas) p-5'>
                        <div className='flex items-center gap-2'>
                            <CalendarDays
                                size={16}
                                className='text-(--text-sub)'
                            />
                            <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                                Timeline and capacity
                            </h2>
                        </div>
                        <p className='mt-1 text-xs text-(--text-sub)'>
                            Times use Africa/Algiers (UTC+1). Disabled dates are
                            struck through.
                        </p>

                        <div className='mt-4 space-y-4'>
                            <div className='grid gap-4 sm:grid-cols-2'>
                                <DateCalendar
                                    id='deadline-date'
                                    label='Applications close date'
                                    value={deadlineDate}
                                    onChange={setDeadlineDate}
                                    min={minimumDeadline}
                                />
                                <TimeField
                                    id='deadline-time'
                                    label='Applications close time'
                                    value={deadlineTime}
                                    onChange={setDeadlineTime}
                                />
                            </div>
                            <div className='grid gap-4 sm:grid-cols-2'>
                                <DateCalendar
                                    id='from-date'
                                    label='Interviews from'
                                    value={fromDate}
                                    onChange={setFromDate}
                                    min={minimumFrom}
                                />
                                <TimeField
                                    id='from-time'
                                    label='Interviews from time'
                                    value={fromTime}
                                    onChange={setFromTime}
                                />
                            </div>
                            <div className='grid gap-4 sm:grid-cols-2'>
                                <DateCalendar
                                    id='until-date'
                                    label='Interviews until'
                                    value={untilDate}
                                    onChange={setUntilDate}
                                    min={minimumUntil}
                                />
                                <TimeField
                                    id='until-time'
                                    label='Interviews until time'
                                    value={untilTime}
                                    onChange={setUntilTime}
                                />
                            </div>
                            <label className='block sm:max-w-xs'>
                                <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Interview capacity
                                </span>
                                <input
                                    type='number'
                                    min={1}
                                    max={500}
                                    value={capacity}
                                    onChange={(event) =>
                                        setCapacity(event.target.value)
                                    }
                                    required
                                    className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm text-(--text-main)'
                                />
                            </label>
                        </div>
                    </section>

                    <div className='flex flex-wrap items-center justify-between gap-3 border-t border-(--border-line) pt-5'>
                        <Link
                            to='/recruiter/positions'
                            className='text-sm font-semibold text-(--text-sub) underline'>
                            Cancel
                        </Link>
                        <button
                            type='submit'
                            disabled={createPosition.isPending}
                            className='inline-flex items-center gap-2 rounded-md bg-(--btn-main-bg) px-5 py-3 font-grotesque text-xl font-bold text-(--btn-main-text) transition-opacity hover:opacity-90 disabled:opacity-50'>
                            {createPosition.isPending ?
                                <Loader2
                                    size={16}
                                    className='animate-spin'
                                />
                            :   <Send size={16} />}
                            {createPosition.isPending ?
                                'Publishing...'
                            :   'Publish position'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
