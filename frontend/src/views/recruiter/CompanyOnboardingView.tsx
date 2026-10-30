import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    AlertTriangle,
    Building2,
    Check,
    MapPin,
    Pencil,
    Plus,
    Power,
    RotateCcw,
    Save,
    Send,
    X,
} from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { ALGERIA_WILAYAS } from '../../data/algeria';
import { useAuthStore } from '../../store/useAuthStore';

type Department = {
    id: string;
    name: string;
    isActive: boolean;
};

type Branch = {
    id: string;
    label: string;
    wilaya: string;
    address: string | null;
    isHeadquarters: boolean;
    isActive: boolean;
};

type Company = {
    id: string;
    name: string;
    employeeCount: number | null;
    industry: string | null;
    website: string | null;
    description: string | null;
    status:
        | 'DRAFT'
        | 'PENDING'
        | 'APPROVED'
        | 'REJECTED'
        | 'FROZEN'
        | 'ARCHIVED'
        | 'DELETED';
    rejectionReason: string | null;
    submittedAt: string | null;
    departments: Department[];
    branches: Branch[];
};

type BranchDraft = {
    label: string;
    wilaya: string;
    address: string;
    isHeadquarters: boolean;
};

const emptyBranch: BranchDraft = {
    label: '',
    wilaya: '16 - Alger',
    address: '',
    isHeadquarters: false,
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

export default function CompanyOnboardingView() {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);

    const { data: company, isLoading, error } = useQuery({
        queryKey: ['my-company'],
        queryFn: async () => {
            const { data } = await apiClient.get('/recruiter/company');
            return data.company as Company;
        },
    });

    const [name, setName] = useState('');
    const [employeeCount, setEmployeeCount] = useState('');
    const [industry, setIndustry] = useState('');
    const [website, setWebsite] = useState('');
    const [description, setDescription] = useState('');
    const [newDepartment, setNewDepartment] = useState('');
    const [editingDepartment, setEditingDepartment] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [branchDraft, setBranchDraft] = useState<BranchDraft>(emptyBranch);
    const [editingBranch, setEditingBranch] = useState<
        (BranchDraft & { id: string }) | null
    >(null);
    const [notice, setNotice] = useState('');
    const [formError, setFormError] = useState('');
    const initializedCompanyRef = useRef<string | null>(null);

    const status = company?.status ?? 'DRAFT';
    const canEdit =
        status === 'DRAFT' || status === 'REJECTED' || status === 'APPROVED';
    const readOnly = !canEdit;

    useEffect(() => {
        if (!company) return;

        if (initializedCompanyRef.current !== company.id) {
            initializedCompanyRef.current = company.id;
            setName(company.name);
            setEmployeeCount(
                company.employeeCount ? String(company.employeeCount) : ''
            );
            setIndustry(company.industry ?? '');
            setWebsite(company.website ?? '');
            setDescription(company.description ?? '');
        }

        if (
            user &&
            (user.companyStatus !== company.status ||
                user.companyName !== company.name)
        ) {
            setUser({
                ...user,
                companyStatus: company.status,
                companyName: company.name,
                companyId: company.id,
            });
        }
    }, [company, user, setUser]);

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ['my-company'] });

    const updateProfile = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.patch('/recruiter/company', {
                name,
                employeeCount: employeeCount
                    ? Number(employeeCount)
                    : undefined,
                industry,
                website,
                description,
            });
            return data.company as Company;
        },
        onSuccess: () => {
            setNotice('Company profile saved.');
            setFormError('');
            invalidate();
        },
        onError: (mutationError) => {
            setFormError(errorMessage(mutationError));
            setNotice('');
        },
    });

    const addDepartment = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post(
                '/recruiter/company/departments',
                { name: newDepartment }
            );
            return data.department as Department;
        },
        onSuccess: () => {
            setNewDepartment('');
            setFormError('');
            invalidate();
        },
        onError: (mutationError) =>
            setFormError(errorMessage(mutationError)),
    });

    const updateDepartment = useMutation({
        mutationFn: async (input: {
            id: string;
            name?: string;
            isActive?: boolean;
        }) => {
            const { data } = await apiClient.patch(
                `/recruiter/company/departments/${input.id}`,
                {
                    ...(input.name !== undefined ?
                        { name: input.name }
                    :   {}),
                    ...(input.isActive !== undefined ?
                        { isActive: input.isActive }
                    :   {}),
                }
            );
            return data.department as Department;
        },
        onSuccess: () => {
            setEditingDepartment(null);
            setFormError('');
            invalidate();
        },
        onError: (mutationError) =>
            setFormError(errorMessage(mutationError)),
    });

    const addBranch = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post(
                '/recruiter/company/branches',
                branchDraft
            );
            return data.branch as Branch;
        },
        onSuccess: () => {
            setBranchDraft(emptyBranch);
            setFormError('');
            invalidate();
        },
        onError: (mutationError) =>
            setFormError(errorMessage(mutationError)),
    });

    const updateBranch = useMutation({
        mutationFn: async (input: BranchDraft & { id: string }) => {
            const { data } = await apiClient.patch(
                `/recruiter/company/branches/${input.id}`,
                {
                    label: input.label,
                    wilaya: input.wilaya,
                    address: input.address,
                    isHeadquarters: input.isHeadquarters,
                }
            );
            return data.branch as Branch;
        },
        onSuccess: () => {
            setEditingBranch(null);
            setFormError('');
            invalidate();
        },
        onError: (mutationError) =>
            setFormError(errorMessage(mutationError)),
    });

    const setBranchActive = useMutation({
        mutationFn: async (input: { id: string; isActive: boolean }) => {
            const { data } = await apiClient.patch(
                `/recruiter/company/branches/${input.id}`,
                { isActive: input.isActive }
            );
            return data.branch as Branch;
        },
        onSuccess: () => {
            setFormError('');
            invalidate();
        },
        onError: (mutationError) =>
            setFormError(errorMessage(mutationError)),
    });

    const submitCompany = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post(
                '/recruiter/company/submit'
            );
            return data.company as Company;
        },
        onSuccess: () => {
            setNotice('Company profile submitted for review.');
            setFormError('');
            invalidate();
        },
        onError: (mutationError) => {
            setFormError(errorMessage(mutationError));
            setNotice('');
        },
    });

    const submitForReview = async () => {
        try {
            setFormError('');
            await updateProfile.mutateAsync();
            await submitCompany.mutateAsync();
        } catch {
            // The mutation error handlers surface the message.
        }
    };

    if (isLoading) {
        return (
            <div className='page-scroll flex items-center justify-center'>
                <p className='text-sm text-(--text-sub)'>Loading company profile...</p>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className='page-scroll flex items-center justify-center px-6'>
                <div className='max-w-md rounded-lg border border-(--border-line) bg-(--bg-panel) p-6 text-center'>
                    <AlertTriangle className='mx-auto text-amber-accent' />
                    <p className='mt-3 text-sm text-(--text-main)'>
                        {error ? errorMessage(error) : 'Company profile not found.'}
                    </p>
                </div>
            </div>
        );
    }

    const activeDepartments = company.departments.filter(
        (department) => department.isActive
    );
    const activeBranches = company.branches.filter((branch) => branch.isActive);

    return (
        <div className='page-scroll'>
            <div className='mx-auto w-full max-w-5xl px-4 py-6 sm:px-6'>
                <div className='flex flex-col gap-3 border-b border-(--border-line) pb-5 sm:flex-row sm:items-end sm:justify-between'>
                    <div>
                        <p className='font-mono text-[10px] uppercase tracking-[0.18em] text-(--text-sub)'>
                            Company
                        </p>
                        <h1 className='mt-1 font-grotesque text-4xl font-extrabold tracking-tight text-(--text-main)'>
                            Company Profile
                        </h1>
                        <p className='mt-1 text-sm text-(--text-sub)'>
                            This information powers your job posts, departments,
                            and branch locations.
                        </p>
                    </div>
                    {status === 'APPROVED' && (
                        <Link
                            to='/recruiter/positions'
                            className='inline-flex items-center justify-center rounded-md bg-(--btn-main-bg) px-4 py-2 text-sm font-semibold text-(--btn-main-text) transition-opacity hover:opacity-90'>
                            Go to positions
                        </Link>
                    )}
                </div>

                <StatusBanner company={company} />

                {(notice || formError) && (
                    <div
                        className={`mt-4 rounded-md border p-3 text-xs ${
                            formError ?
                                'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
                            :   'border-forest/30 bg-forest/5 text-forest dark:text-forest-dark'
                        }`}>
                        {formError || notice}
                    </div>
                )}

                <section className='mt-6 rounded-lg border border-(--border-line) bg-(--bg-canvas)'>
                    <div className='flex items-center gap-2 border-b border-(--border-line) px-5 py-4'>
                        <Building2
                            size={18}
                            className='text-(--text-sub)'
                        />
                        <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                            Profile
                        </h2>
                    </div>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            updateProfile.mutate();
                        }}
                        className='space-y-4 p-5'>
                        <div className='grid gap-4 sm:grid-cols-2'>
                            <label className='block'>
                                <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Company name
                                </span>
                                <input
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    disabled={readOnly}
                                    required
                                    className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm text-(--text-main) disabled:opacity-60'
                                />
                            </label>
                            <label className='block'>
                                <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Number of employees
                                </span>
                                <input
                                    type='number'
                                    min={1}
                                    value={employeeCount}
                                    onChange={(event) =>
                                        setEmployeeCount(event.target.value)
                                    }
                                    disabled={readOnly}
                                    placeholder='e.g. 120'
                                    className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm text-(--text-main) disabled:opacity-60'
                                />
                            </label>
                            <label className='block'>
                                <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Industry
                                </span>
                                <input
                                    value={industry}
                                    onChange={(event) =>
                                        setIndustry(event.target.value)
                                    }
                                    disabled={readOnly}
                                    placeholder='e.g. Cloud infrastructure'
                                    className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm text-(--text-main) disabled:opacity-60'
                                />
                            </label>
                            <label className='block'>
                                <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Website
                                </span>
                                <input
                                    type='url'
                                    value={website}
                                    onChange={(event) =>
                                        setWebsite(event.target.value)
                                    }
                                    disabled={readOnly}
                                    placeholder='https://example.com'
                                    className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm text-(--text-main) disabled:opacity-60'
                                />
                            </label>
                        </div>
                        <label className='block'>
                            <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                About the company
                            </span>
                            <textarea
                                rows={4}
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                disabled={readOnly}
                                placeholder='What your company builds, who it serves, and why candidates should join.'
                                className='w-full resize-y rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm text-(--text-main) disabled:opacity-60'
                            />
                        </label>
                        {canEdit && (
                            <div className='flex flex-wrap items-center gap-3'>
                                <button
                                    type='submit'
                                    disabled={updateProfile.isPending}
                                    className='inline-flex items-center gap-2 rounded-md bg-(--btn-main-bg) px-4 py-2 text-sm font-semibold text-(--btn-main-text) transition-opacity hover:opacity-90 disabled:opacity-50'>
                                    <Save size={14} />
                                    {updateProfile.isPending ?
                                        'Saving...'
                                    :   'Save changes'}
                                </button>
                                {(status === 'DRAFT' ||
                                    status === 'REJECTED') && (
                                    <button
                                        type='button'
                                        onClick={submitForReview}
                                        disabled={
                                            submitCompany.isPending ||
                                            updateProfile.isPending
                                        }
                                        className='inline-flex items-center gap-2 rounded-md border border-(--border-line) px-4 py-2 text-sm font-semibold text-(--text-main) transition-colors hover:bg-(--bg-panel) disabled:opacity-50'>
                                        <Send size={14} />
                                        {submitCompany.isPending ?
                                            'Submitting...'
                                        :   'Submit for review'}
                                    </button>
                                )}
                            </div>
                        )}
                    </form>
                </section>

                <div className='mt-6 grid gap-6 lg:grid-cols-2'>
                    <section className='rounded-lg border border-(--border-line) bg-(--bg-canvas)'>
                        <div className='flex items-center justify-between border-b border-(--border-line) px-5 py-4'>
                            <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                                Departments
                            </h2>
                            <span className='font-mono text-[10px] text-(--text-sub)'>
                                {activeDepartments.length} active
                            </span>
                        </div>
                        <div className='space-y-3 p-5'>
                            {company.departments.length === 0 && (
                                <p className='text-xs text-(--text-sub)'>
                                    Add at least one department to organize job
                                    posts.
                                </p>
                            )}
                            {company.departments.map((department) => (
                                <div
                                    key={department.id}
                                    className={`flex flex-wrap items-center gap-2 rounded-md border border-(--border-line) p-2.5 ${
                                        department.isActive ?
                                            ''
                                        :   'opacity-60'
                                    }`}>
                                    {editingDepartment?.id === department.id ?
                                        <>
                                            <input
                                                value={editingDepartment.name}
                                                onChange={(event) =>
                                                    setEditingDepartment({
                                                        ...editingDepartment,
                                                        name: event.target.value,
                                                    })
                                                }
                                                className='min-w-0 flex-1 rounded border border-(--border-line) bg-(--bg-canvas) px-2 py-1 text-xs text-(--text-main)'
                                            />
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    updateDepartment.mutate({
                                                        id: department.id,
                                                        name: editingDepartment.name,
                                                    })
                                                }
                                                className='rounded bg-(--btn-main-bg) px-2 py-1 text-[10px] font-semibold text-(--btn-main-text)'>
                                                Save
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    setEditingDepartment(null)
                                                }
                                                className='rounded border border-(--border-line) p-1 text-(--text-sub)'>
                                                <X size={13} />
                                            </button>
                                        </>
                                    :   <>
                                            <span className='min-w-0 flex-1 text-sm text-(--text-main)'>
                                                {department.name}
                                            </span>
                                            {!department.isActive && (
                                                <span className='font-mono text-[9px] uppercase text-(--text-sub)'>
                                                    Inactive
                                                </span>
                                            )}
                                            {canEdit && (
                                                <>
                                                    <button
                                                        type='button'
                                                        onClick={() =>
                                                            setEditingDepartment(
                                                                {
                                                                    id: department.id,
                                                                    name: department.name,
                                                                }
                                                            )
                                                        }
                                                        aria-label={`Rename ${department.name}`}
                                                        className='rounded border border-(--border-line) p-1 text-(--text-sub) hover:text-(--text-main)'>
                                                        <Pencil size={12} />
                                                    </button>
                                                    <button
                                                        type='button'
                                                        onClick={() =>
                                                            updateDepartment.mutate(
                                                                {
                                                                    id: department.id,
                                                                    isActive:
                                                                        !department.isActive,
                                                                }
                                                            )
                                                        }
                                                        aria-label={
                                                            department.isActive ?
                                                                `Deactivate ${department.name}`
                                                            :   `Activate ${department.name}`
                                                        }
                                                        className='rounded border border-(--border-line) p-1 text-(--text-sub) hover:text-(--text-main)'>
                                                        {department.isActive ?
                                                            <Power size={12} />
                                                        :   <RotateCcw size={12} />}
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    }
                                </div>
                            ))}
                            {canEdit && (
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        addDepartment.mutate();
                                    }}
                                    className='flex gap-2 border-t border-(--border-line) pt-3'>
                                    <input
                                        value={newDepartment}
                                        onChange={(event) =>
                                            setNewDepartment(event.target.value)
                                        }
                                        placeholder='New department'
                                        required
                                        className='min-w-0 flex-1 rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-xs text-(--text-main)'
                                    />
                                    <button
                                        type='submit'
                                        disabled={addDepartment.isPending}
                                        className='inline-flex items-center gap-1 rounded-md bg-(--btn-main-bg) px-3 py-2 text-xs font-semibold text-(--btn-main-text) disabled:opacity-50'>
                                        <Plus size={13} />
                                        Add
                                    </button>
                                </form>
                            )}
                        </div>
                    </section>

                    <section className='rounded-lg border border-(--border-line) bg-(--bg-canvas)'>
                        <div className='flex items-center justify-between border-b border-(--border-line) px-5 py-4'>
                            <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                                Branches
                            </h2>
                            <span className='font-mono text-[10px] text-(--text-sub)'>
                                {activeBranches.length} active
                            </span>
                        </div>
                        <div className='space-y-3 p-5'>
                            {company.branches.length === 0 && (
                                <p className='text-xs text-(--text-sub)'>
                                    Add at least one branch so job locations can
                                    be selected.
                                </p>
                            )}
                            {company.branches.map((branch) => (
                                <div
                                    key={branch.id}
                                    className={`rounded-md border border-(--border-line) p-2.5 ${
                                        branch.isActive ? '' : 'opacity-60'
                                    }`}>
                                    {editingBranch?.id === branch.id ?
                                        <div className='space-y-2'>
                                            <input
                                                value={editingBranch.label}
                                                onChange={(event) =>
                                                    setEditingBranch({
                                                        ...editingBranch,
                                                        label: event.target.value,
                                                    })
                                                }
                                                className='w-full rounded border border-(--border-line) bg-(--bg-canvas) px-2 py-1 text-xs text-(--text-main)'
                                            />
                                            <select
                                                value={editingBranch.wilaya}
                                                onChange={(event) =>
                                                    setEditingBranch({
                                                        ...editingBranch,
                                                        wilaya: event.target.value,
                                                    })
                                                }
                                                className='w-full rounded border border-(--border-line) bg-(--bg-canvas) px-2 py-1 text-xs text-(--text-main)'>
                                                {ALGERIA_WILAYAS.map((wilaya) => (
                                                    <option key={wilaya} value={wilaya}>
                                                        {wilaya}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                value={editingBranch.address}
                                                onChange={(event) =>
                                                    setEditingBranch({
                                                        ...editingBranch,
                                                        address: event.target.value,
                                                    })
                                                }
                                                placeholder='Address (optional)'
                                                className='w-full rounded border border-(--border-line) bg-(--bg-canvas) px-2 py-1 text-xs text-(--text-main)'
                                            />
                                            <div className='flex items-center justify-between gap-2'>
                                                <label className='flex items-center gap-1.5 text-[10px] text-(--text-sub)'>
                                                    <input
                                                        type='checkbox'
                                                        checked={editingBranch.isHeadquarters}
                                                        onChange={(event) =>
                                                            setEditingBranch({
                                                                ...editingBranch,
                                                                isHeadquarters:
                                                                    event.target.checked,
                                                            })
                                                        }
                                                    />
                                                    Headquarters
                                                </label>
                                                <div className='flex gap-1'>
                                                    <button
                                                        type='button'
                                                        onClick={() =>
                                                            updateBranch.mutate(
                                                                editingBranch
                                                            )
                                                        }
                                                        className='rounded bg-(--btn-main-bg) px-2 py-1 text-[10px] font-semibold text-(--btn-main-text)'>
                                                        Save
                                                    </button>
                                                    <button
                                                        type='button'
                                                        onClick={() =>
                                                            setEditingBranch(null)
                                                        }
                                                        className='rounded border border-(--border-line) p-1 text-(--text-sub)'>
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    :   <div className='flex flex-wrap items-start justify-between gap-2'>
                                            <div>
                                                <div className='flex items-center gap-2 text-sm font-semibold text-(--text-main)'>
                                                    {branch.label}
                                                    {branch.isHeadquarters && (
                                                        <span className='rounded bg-forest/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-forest dark:text-forest-dark'>
                                                            HQ
                                                        </span>
                                                    )}
                                                </div>
                                                <div className='mt-0.5 flex items-center gap-1 text-xs text-(--text-sub)'>
                                                    <MapPin size={11} />
                                                    {branch.wilaya}
                                                    {branch.address ? ` · ${branch.address}` : ''}
                                                </div>
                                                {!branch.isActive && (
                                                    <span className='mt-1 inline-block font-mono text-[9px] uppercase text-(--text-sub)'>
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            {canEdit && (
                                                <div className='flex gap-1'>
                                                    <button
                                                        type='button'
                                                        onClick={() =>
                                                            setEditingBranch({
                                                                id: branch.id,
                                                                label: branch.label,
                                                                wilaya: branch.wilaya,
                                                                address:
                                                                    branch.address ?? '',
                                                                isHeadquarters:
                                                                    branch.isHeadquarters,
                                                            })
                                                        }
                                                        aria-label={`Edit ${branch.label}`}
                                                        className='rounded border border-(--border-line) p-1 text-(--text-sub) hover:text-(--text-main)'>
                                                        <Pencil size={12} />
                                                    </button>
                                                    <button
                                                        type='button'
                                                        onClick={() =>
                                                            setBranchActive.mutate(
                                                                {
                                                                    id: branch.id,
                                                                    isActive:
                                                                        !branch.isActive,
                                                                }
                                                            )
                                                        }
                                                        aria-label={
                                                            branch.isActive ?
                                                                `Deactivate ${branch.label}`
                                                            :   `Activate ${branch.label}`
                                                        }
                                                        className='rounded border border-(--border-line) p-1 text-(--text-sub) hover:text-(--text-main)'>
                                                        {branch.isActive ?
                                                            <Power size={12} />
                                                        :   <RotateCcw size={12} />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    }
                                </div>
                            ))}
                            {canEdit && (
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        addBranch.mutate();
                                    }}
                                    className='space-y-2 border-t border-(--border-line) pt-3'>
                                    <input
                                        value={branchDraft.label}
                                        onChange={(event) =>
                                            setBranchDraft({
                                                ...branchDraft,
                                                label: event.target.value,
                                            })
                                        }
                                        placeholder='Branch name (e.g. Algiers HQ)'
                                        required
                                        className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-xs text-(--text-main)'
                                    />
                                    <select
                                        value={branchDraft.wilaya}
                                        onChange={(event) =>
                                            setBranchDraft({
                                                ...branchDraft,
                                                wilaya: event.target.value,
                                            })
                                        }
                                        className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-xs text-(--text-main)'>
                                        {ALGERIA_WILAYAS.map((wilaya) => (
                                            <option key={wilaya} value={wilaya}>
                                                {wilaya}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        value={branchDraft.address}
                                        onChange={(event) =>
                                            setBranchDraft({
                                                ...branchDraft,
                                                address: event.target.value,
                                            })
                                        }
                                        placeholder='Address (optional)'
                                        className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-xs text-(--text-main)'
                                    />
                                    <label className='flex items-center gap-2 text-[10px] text-(--text-sub)'>
                                        <input
                                            type='checkbox'
                                            checked={branchDraft.isHeadquarters}
                                            onChange={(event) =>
                                                setBranchDraft({
                                                    ...branchDraft,
                                                    isHeadquarters:
                                                        event.target.checked,
                                                })
                                            }
                                        />
                                        Headquarters
                                    </label>
                                    <button
                                        type='submit'
                                        disabled={addBranch.isPending}
                                        className='inline-flex items-center gap-1 rounded-md bg-(--btn-main-bg) px-3 py-2 text-xs font-semibold text-(--btn-main-text) disabled:opacity-50'>
                                        <Plus size={13} />
                                        Add branch
                                    </button>
                                </form>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function StatusBanner({ company }: { company: Company }) {
    if (company.status === 'PENDING') {
        return (
            <div className='mt-5 flex items-start gap-3 rounded-lg border border-amber-accent/30 bg-amber-accent/5 p-4'>
                <AlertTriangle
                    size={18}
                    className='mt-0.5 shrink-0 text-amber-accent'
                />
                <div>
                    <p className='text-sm font-semibold text-(--text-main)'>
                        Company profile under review
                    </p>
                    <p className='mt-1 text-xs leading-relaxed text-(--text-sub)'>
                        Your profile was submitted
                        {company.submittedAt ?
                            ` on ${new Date(company.submittedAt).toLocaleDateString()}`
                        :   ''}
                        . You can publish jobs once a Skillora admin approves
                        it.
                    </p>
                </div>
            </div>
        );
    }

    if (company.status === 'REJECTED') {
        return (
            <div className='mt-5 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4'>
                <AlertTriangle
                    size={18}
                    className='mt-0.5 shrink-0 text-red-600 dark:text-red-400'
                />
                <div>
                    <p className='text-sm font-semibold text-(--text-main)'>
                        Changes requested
                    </p>
                    <p className='mt-1 text-xs leading-relaxed text-(--text-sub)'>
                        {company.rejectionReason ||
                            'The company profile needs more information before it can be approved.'}
                    </p>
                    <p className='mt-1 text-xs text-(--text-sub)'>
                        Edit the profile and submit it again.
                    </p>
                </div>
            </div>
        );
    }

    if (company.status === 'APPROVED') {
        return (
            <div className='mt-5 flex items-start gap-3 rounded-lg border border-forest/30 bg-forest/5 p-4'>
                <Check
                    size={18}
                    className='mt-0.5 shrink-0 text-forest dark:text-forest-dark'
                />
                <div>
                    <p className='text-sm font-semibold text-(--text-main)'>
                        Company approved
                    </p>
                    <p className='mt-1 text-xs leading-relaxed text-(--text-sub)'>
                        You can publish jobs, manage departments and branches,
                        and review candidates.
                    </p>
                </div>
            </div>
        );
    }

    if (company.status === 'FROZEN') {
        return (
            <div className='mt-5 flex items-start gap-3 rounded-lg border border-amber-accent/30 bg-amber-accent/5 p-4'>
                <AlertTriangle
                    size={18}
                    className='mt-0.5 shrink-0 text-amber-accent'
                />
                <div>
                    <p className='text-sm font-semibold text-(--text-main)'>
                        Company frozen
                    </p>
                    <p className='mt-1 text-xs leading-relaxed text-(--text-sub)'>
                        Your workspace is read-only while an admin reviews the
                        account. You can still view your data.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className='mt-5 rounded-lg border border-(--border-line) bg-(--bg-panel) p-4'>
            <p className='text-sm font-semibold text-(--text-main)'>
                Complete your company profile
            </p>
            <p className='mt-1 text-xs leading-relaxed text-(--text-sub)'>
                Add your size, departments, and branches, then submit for
                review. You can publish jobs after approval.
            </p>
        </div>
    );
}
