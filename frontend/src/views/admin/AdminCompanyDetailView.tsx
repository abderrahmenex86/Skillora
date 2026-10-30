import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
    AlertTriangle,
    Archive,
    ArrowLeft,
    Briefcase,
    Building2,
    Check,
    MapPin,
    Snowflake,
    Trash2,
    Undo2,
    Users,
} from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { formatDateTime } from '../../lib/dateTime';

type AdminAction =
    | 'approve'
    | 'reject'
    | 'freeze'
    | 'unfreeze'
    | 'archive'
    | 'restore'
    | 'delete';

type CompanyDetail = {
    id: string;
    name: string;
    employeeCount: number | null;
    industry: string | null;
    website: string | null;
    description: string | null;
    status: string;
    rejectionReason: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    createdAt: string;
    owner: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
    };
    departments: Array<{ id: string; name: string; isActive: boolean }>;
    branches: Array<{
        id: string;
        label: string;
        wilaya: string;
        address: string | null;
        isHeadquarters: boolean;
        isActive: boolean;
    }>;
    positions: Array<{
        id: string;
        title: string;
        status: string;
        deadline: string;
        _count: { applications: number };
    }>;
    events: Array<{
        id: string;
        type: string;
        note: string | null;
        createdAt: string;
        admin: {
            firstName: string;
            lastName: string;
            email: string;
        } | null;
    }>;
};

const ACTION_COPY: Record<
    AdminAction,
    {
        title: string;
        description: string;
        confirm: string;
        reason?: boolean;
        destructive?: boolean;
    }
> = {
    approve: {
        title: 'Approve company',
        description:
            'The recruiter will be able to complete their profile and publish jobs.',
        confirm: 'Approve company',
    },
    reject: {
        title: 'Reject company',
        description:
            'The recruiter will see this reason and can edit the profile and resubmit.',
        confirm: 'Reject company',
        reason: true,
    },
    freeze: {
        title: 'Freeze company',
        description:
            'Recruiters keep read-only access. Public jobs and pipeline actions are disabled until unfrozen.',
        confirm: 'Freeze company',
    },
    unfreeze: {
        title: 'Unfreeze company',
        description:
            'The company returns to approved status and recruiters can publish and manage again.',
        confirm: 'Unfreeze company',
    },
    archive: {
        title: 'Archive company',
        description:
            'Recruiters cannot log in and public jobs are hidden. You can restore the company later.',
        confirm: 'Archive company',
        destructive: true,
    },
    restore: {
        title: 'Restore company',
        description:
            'The company returns to approved status and its recruiters can log in again.',
        confirm: 'Restore company',
    },
    delete: {
        title: 'Delete company',
        description:
            'This is a soft delete. The company is hidden and access is blocked, but data is retained for audit.',
        confirm: 'Delete company',
        reason: true,
        destructive: true,
    },
};

function actionButtonClass(destructive = false) {
    return destructive ?
        'inline-flex items-center gap-2 rounded-md border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400'
    :   'inline-flex items-center gap-2 rounded-md border border-(--border-line) px-3 py-2 text-xs font-semibold text-(--text-main) transition-colors hover:bg-(--bg-panel)';
}

export default function AdminCompanyDetailView() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [action, setAction] = useState<AdminAction | null>(null);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const { data: company, isLoading } = useQuery({
        queryKey: ['admin-company', id],
        queryFn: async () => {
            const { data } = await apiClient.get(
                `/admin/companies/${id}`
            );
            return data.company as CompanyDetail;
        },
        enabled: Boolean(id),
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-company', id] });
        queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    };

    const mutateAction = useMutation({
        mutationFn: async (selected: AdminAction) => {
            const config = ACTION_COPY[selected];
            const path = `/admin/companies/${id}`;
            if (selected === 'delete') {
                const { data } = await apiClient.delete(path, {
                    data: { reason },
                });
                return data.company as CompanyDetail;
            }

            const { data } = await apiClient.post(
                `${path}/${selected}`,
                config.reason ? { reason } : {}
            );
            return data.company as CompanyDetail;
        },
        onSuccess: (updated) => {
            setAction(null);
            setReason('');
            setError('');
            setNotice(`Company is now ${updated.status}.`);
            invalidate();
        },
        onError: (mutationError: any) => {
            setError(
                mutationError.response?.data?.error ||
                    'Could not complete this action.'
            );
        },
    });

    if (isLoading) {
        return (
            <div className='page-scroll flex items-center justify-center'>
                <p className='text-sm text-(--text-sub)'>Loading company...</p>
            </div>
        );
    }

    if (!company) {
        return (
            <div className='page-scroll flex items-center justify-center px-6'>
                <p className='text-sm text-(--text-sub)'>Company not found.</p>
            </div>
        );
    }

    const canApprove = company.status === 'PENDING';
    const canReject = company.status === 'PENDING';
    const canFreeze = company.status === 'APPROVED';
    const canUnfreeze = company.status === 'FROZEN';
    const canArchive =
        company.status === 'APPROVED' || company.status === 'FROZEN';
    const canRestore = company.status === 'ARCHIVED';
    const canDelete = company.status !== 'DELETED';
    const config = action ? ACTION_COPY[action] : null;

    return (
        <div className='page-scroll'>
            <div className='mx-auto w-full max-w-6xl px-4 py-6 sm:px-6'>
                <Link
                    to='/admin/companies'
                    className='inline-flex items-center gap-1.5 text-xs font-mono text-(--text-sub) transition-colors hover:text-(--text-main)'>
                    <ArrowLeft size={14} /> Back to companies
                </Link>

                <div className='mt-3 flex flex-col gap-4 border-b border-(--border-line) pb-5 lg:flex-row lg:items-start lg:justify-between'>
                    <div>
                        <div className='flex flex-wrap items-center gap-2'>
                            <h1 className='font-grotesque text-4xl font-extrabold tracking-tight text-(--text-main)'>
                                {company.name}
                            </h1>
                            <span className='rounded border border-(--border-line) bg-(--bg-panel) px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-(--text-sub)'>
                                {company.status}
                            </span>
                        </div>
                        <p className='mt-1 text-sm text-(--text-sub)'>
                            {company.owner.firstName}{' '}
                            {company.owner.lastName} ·{' '}
                            {company.owner.email}
                        </p>
                        <p className='mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-(--text-sub)'>
                            Submitted{' '}
                            {company.submittedAt ?
                                formatDateTime(company.submittedAt)
                            :   '—'}{' '}
                            · Reviewed{' '}
                            {company.reviewedAt ?
                                formatDateTime(company.reviewedAt)
                            :   '—'}
                        </p>
                    </div>

                    <div className='flex flex-wrap gap-2'>
                        {canApprove && (
                            <button
                                type='button'
                                onClick={() => setAction('approve')}
                                className={actionButtonClass()}>
                                <Check size={14} /> Approve
                            </button>
                        )}
                        {canReject && (
                            <button
                                type='button'
                                onClick={() => setAction('reject')}
                                className={actionButtonClass(true)}>
                                <AlertTriangle size={14} /> Reject
                            </button>
                        )}
                        {canFreeze && (
                            <button
                                type='button'
                                onClick={() => setAction('freeze')}
                                className={actionButtonClass()}>
                                <Snowflake size={14} /> Freeze
                            </button>
                        )}
                        {canUnfreeze && (
                            <button
                                type='button'
                                onClick={() => setAction('unfreeze')}
                                className={actionButtonClass()}>
                                <Undo2 size={14} /> Unfreeze
                            </button>
                        )}
                        {canArchive && (
                            <button
                                type='button'
                                onClick={() => setAction('archive')}
                                className={actionButtonClass(true)}>
                                <Archive size={14} /> Archive
                            </button>
                        )}
                        {canRestore && (
                            <button
                                type='button'
                                onClick={() => setAction('restore')}
                                className={actionButtonClass()}>
                                <Undo2 size={14} /> Restore
                            </button>
                        )}
                        {canDelete && (
                            <button
                                type='button'
                                onClick={() => setAction('delete')}
                                className={actionButtonClass(true)}>
                                <Trash2 size={14} /> Delete
                            </button>
                        )}
                    </div>
                </div>

                {(notice || error) && (
                    <div
                        className={`mt-4 rounded-md border p-3 text-xs ${
                            error ?
                                'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
                            :   'border-forest/30 bg-forest/5 text-forest dark:text-forest-dark'
                        }`}>
                        {error || notice}
                    </div>
                )}

                {company.rejectionReason && (
                    <div className='mt-4 rounded-md border border-red-500/20 bg-red-500/5 p-3 text-xs leading-relaxed text-(--text-main)'>
                        <span className='font-mono text-[9px] uppercase tracking-[0.12em] text-red-600 dark:text-red-400'>
                            Rejection reason
                        </span>
                        <p className='mt-1'>{company.rejectionReason}</p>
                    </div>
                )}

                <div className='mt-6 grid gap-6 lg:grid-cols-3'>
                    <section className='rounded-lg border border-(--border-line) bg-(--bg-canvas) p-5 lg:col-span-1'>
                        <div className='flex items-center gap-2 border-b border-(--border-line) pb-3'>
                            <Building2
                                size={16}
                                className='text-(--text-sub)'
                            />
                            <h2 className='font-grotesque text-xl font-bold text-(--text-main)'>
                                Company profile
                            </h2>
                        </div>
                        <dl className='mt-4 space-y-3 text-xs'>
                            <div>
                                <dt className='font-mono text-[9px] uppercase tracking-[0.1em] text-(--text-sub)'>
                                    Employees
                                </dt>
                                <dd className='mt-0.5 text-(--text-main)'>
                                    {company.employeeCount ?? '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className='font-mono text-[9px] uppercase tracking-[0.1em] text-(--text-sub)'>
                                    Industry
                                </dt>
                                <dd className='mt-0.5 text-(--text-main)'>
                                    {company.industry ?? '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className='font-mono text-[9px] uppercase tracking-[0.1em] text-(--text-sub)'>
                                    Website
                                </dt>
                                <dd className='mt-0.5 break-all text-(--text-main)'>
                                    {company.website ?? '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className='font-mono text-[9px] uppercase tracking-[0.1em] text-(--text-sub)'>
                                    About
                                </dt>
                                <dd className='mt-0.5 leading-relaxed text-(--text-sub)'>
                                    {company.description ?? '—'}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className='rounded-lg border border-(--border-line) bg-(--bg-canvas) p-5'>
                        <div className='flex items-center gap-2 border-b border-(--border-line) pb-3'>
                            <Users
                                size={16}
                                className='text-(--text-sub)'
                            />
                            <h2 className='font-grotesque text-xl font-bold text-(--text-main)'>
                                Departments
                            </h2>
                        </div>
                        <div className='mt-3 space-y-2'>
                            {company.departments.length === 0 && (
                                <p className='text-xs text-(--text-sub)'>None</p>
                            )}
                            {company.departments.map((department) => (
                                <div
                                    key={department.id}
                                    className='flex items-center justify-between gap-2 rounded border border-(--border-line) px-3 py-2 text-xs'>
                                    <span className='text-(--text-main)'>
                                        {department.name}
                                    </span>
                                    {!department.isActive && (
                                        <span className='font-mono text-[9px] uppercase text-(--text-sub)'>
                                            Inactive
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className='rounded-lg border border-(--border-line) bg-(--bg-canvas) p-5'>
                        <div className='flex items-center gap-2 border-b border-(--border-line) pb-3'>
                            <MapPin
                                size={16}
                                className='text-(--text-sub)'
                            />
                            <h2 className='font-grotesque text-xl font-bold text-(--text-main)'>
                                Branches
                            </h2>
                        </div>
                        <div className='mt-3 space-y-2'>
                            {company.branches.length === 0 && (
                                <p className='text-xs text-(--text-sub)'>None</p>
                            )}
                            {company.branches.map((branch) => (
                                <div
                                    key={branch.id}
                                    className='rounded border border-(--border-line) px-3 py-2 text-xs'>
                                    <div className='flex items-center gap-2 text-(--text-main)'>
                                        {branch.label}
                                        {branch.isHeadquarters && (
                                            <span className='font-mono text-[9px] uppercase text-forest dark:text-forest-dark'>
                                                HQ
                                            </span>
                                        )}
                                    </div>
                                    <div className='mt-0.5 text-[11px] text-(--text-sub)'>
                                        {branch.wilaya}
                                        {branch.address ? ` · ${branch.address}` : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className='mt-6 grid gap-6 lg:grid-cols-2'>
                    <section className='rounded-lg border border-(--border-line) bg-(--bg-canvas)'>
                        <div className='flex items-center gap-2 border-b border-(--border-line) px-5 py-4'>
                            <Briefcase
                                size={16}
                                className='text-(--text-sub)'
                            />
                            <h2 className='font-grotesque text-xl font-bold text-(--text-main)'>
                                Positions ({company.positions.length})
                            </h2>
                        </div>
                        <div className='divide-y divide-(--border-line)'>
                            {company.positions.length === 0 && (
                                <p className='px-5 py-4 text-xs text-(--text-sub)'>
                                    No positions yet.
                                </p>
                            )}
                            {company.positions.map((position) => (
                                <div
                                    key={position.id}
                                    className='flex items-center justify-between gap-3 px-5 py-3 text-xs'>
                                    <div>
                                        <div className='font-semibold text-(--text-main)'>
                                            {position.title}
                                        </div>
                                        <div className='mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-(--text-sub)'>
                                            {position.status} ·{' '}
                                            {position._count.applications}{' '}
                                            applications
                                        </div>
                                    </div>
                                    <span className='shrink-0 font-mono text-[9px] text-(--text-sub)'>
                                        {formatDateTime(position.deadline)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className='rounded-lg border border-(--border-line) bg-(--bg-canvas)'>
                        <div className='flex items-center gap-2 border-b border-(--border-line) px-5 py-4'>
                            <Archive
                                size={16}
                                className='text-(--text-sub)'
                            />
                            <h2 className='font-grotesque text-xl font-bold text-(--text-main)'>
                                Audit history
                            </h2>
                        </div>
                        <div className='space-y-3 p-5'>
                            {company.events.length === 0 && (
                                <p className='text-xs text-(--text-sub)'>
                                    No events yet.
                                </p>
                            )}
                            {company.events.map((event) => (
                                <div
                                    key={event.id}
                                    className='relative border-l border-(--border-line) pl-4'>
                                    <span className='absolute -left-1 top-1 h-2 w-2 rounded-full bg-(--text-main)' />
                                    <div className='font-mono text-[9px] uppercase tracking-[0.12em] text-(--text-sub)'>
                                        {event.type}
                                    </div>
                                    <p className='mt-0.5 text-xs text-(--text-main)'>
                                        {event.note || 'Status updated.'}
                                    </p>
                                    <p className='mt-0.5 text-[10px] text-(--text-sub)'>
                                        {event.admin ?
                                            `${event.admin.firstName} ${event.admin.lastName}`
                                        :   'Recruiter'}{' '}
                                        · {formatDateTime(event.createdAt)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {action && config && (
                <div
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !mutateAction.isPending
                        ) {
                            setAction(null);
                            setError('');
                            setReason('');
                        }
                    }}>
                    <div
                        role='dialog'
                        aria-modal='true'
                        aria-label={config.title}
                        className='w-full max-w-md rounded-lg border border-(--border-line) bg-(--bg-canvas) p-6'>
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            {config.title}
                        </h2>
                        <p className='mt-2 text-xs leading-relaxed text-(--text-sub)'>
                            {config.description}
                        </p>

                        {config.reason && (
                            <label className='mt-4 block'>
                                <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Reason
                                </span>
                                <textarea
                                    rows={3}
                                    value={reason}
                                    onChange={(event) =>
                                        setReason(event.target.value)
                                    }
                                    placeholder='Explain this decision for the audit trail.'
                                    className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-xs text-(--text-main)'
                                />
                            </label>
                        )}

                        {error && (
                            <p className='mt-2 text-xs text-red-600 dark:text-red-400'>
                                {error}
                            </p>
                        )}

                        <div className='mt-5 flex justify-end gap-2'>
                            <button
                                type='button'
                                onClick={() => {
                                    setAction(null);
                                    setError('');
                                    setReason('');
                                }}
                                disabled={mutateAction.isPending}
                                className='rounded-md border border-(--border-line) px-4 py-2 text-xs font-semibold text-(--text-main) disabled:opacity-50'>
                                Cancel
                            </button>
                            <button
                                type='button'
                                onClick={() => mutateAction.mutate(action)}
                                disabled={
                                    mutateAction.isPending ||
                                    (config.reason && reason.trim().length < 3)
                                }
                                className={`rounded-md px-4 py-2 text-xs font-semibold text-(--btn-main-text) disabled:opacity-50 ${
                                    config.destructive ?
                                        'bg-red-600 hover:bg-red-700'
                                    :   'bg-(--btn-main-bg)'
                                }`}>
                                {mutateAction.isPending ?
                                    'Saving...'
                                :   config.confirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
