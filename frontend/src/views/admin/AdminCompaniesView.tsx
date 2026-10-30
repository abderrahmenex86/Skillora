import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Search, Users } from 'lucide-react';
import { apiClient } from '../../api/apiClient';

type AdminCompanyListItem = {
    id: string;
    name: string;
    employeeCount: number | null;
    status: string;
    createdAt: string;
    owner: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    _count: {
        positions: number;
        members: number;
    };
};

const STATUS_TABS = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'FROZEN', label: 'Frozen' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ARCHIVED', label: 'Archived' },
    { value: 'DELETED', label: 'Deleted' },
    { value: 'ALL', label: 'All' },
];

function statusClass(status: string) {
    if (status === 'APPROVED') {
        return 'border-forest/30 bg-forest/10 text-forest dark:text-forest-dark';
    }
    if (status === 'PENDING') {
        return 'border-amber-accent/40 bg-amber-accent/10 text-amber-accent';
    }
    if (status === 'REJECTED' || status === 'DELETED') {
        return 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400';
    }
    if (status === 'FROZEN') {
        return 'border-amber-accent/40 bg-(--bg-panel) text-amber-accent';
    }
    return 'border-(--border-line) bg-(--bg-panel) text-(--text-sub)';
}

export default function AdminCompaniesView() {
    const [status, setStatus] = useState('PENDING');
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['admin-companies'],
        queryFn: async () => {
            const { data } = await apiClient.get('/admin/companies');
            return data.companies as AdminCompanyListItem[];
        },
    });

    const companies = data ?? [];

    const counts = useMemo(() => {
        const result: Record<string, number> = { ALL: companies.length };
        for (const company of companies) {
            result[company.status] = (result[company.status] ?? 0) + 1;
        }
        return result;
    }, [companies]);

    const filtered = companies.filter((company) => {
        const matchesStatus =
            status === 'ALL' || company.status === status;
        const query = search.trim().toLowerCase();
        const matchesSearch =
            !query ||
            company.name.toLowerCase().includes(query) ||
            company.owner.email.toLowerCase().includes(query) ||
            `${company.owner.firstName} ${company.owner.lastName}`
                .toLowerCase()
                .includes(query);
        return matchesStatus && matchesSearch;
    });

    return (
        <div className='page-scroll'>
            <div className='mx-auto w-full max-w-6xl px-4 py-6 sm:px-6'>
                <div className='border-b border-(--border-line) pb-5'>
                    <p className='font-mono text-[10px] uppercase tracking-[0.18em] text-(--text-sub)'>
                        Master admin
                    </p>
                    <h1 className='mt-1 font-grotesque text-4xl font-extrabold tracking-tight text-(--text-main)'>
                        Company reviews
                    </h1>
                    <p className='mt-1 text-sm text-(--text-sub)'>
                        Approve company profiles, manage account status, and
                        audit every decision.
                    </p>
                </div>

                <div className='mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                    <div className='flex flex-wrap gap-1.5'>
                        {STATUS_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                type='button'
                                onClick={() => setStatus(tab.value)}
                                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    status === tab.value ?
                                        'border-(--text-main) bg-(--btn-main-bg) text-(--btn-main-text)'
                                    :   'border-(--border-line) text-(--text-sub) hover:text-(--text-main)'
                                }`}>
                                {tab.label}
                                <span className='ml-1.5 font-mono text-[10px] opacity-70'>
                                    {counts[tab.value] ?? 0}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className='relative w-full lg:w-80'>
                        <Search
                            size={14}
                            className='absolute left-3 top-1/2 -translate-y-1/2 text-(--text-sub)'
                            aria-hidden='true'
                        />
                        <input
                            aria-label='Search companies'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Search company, owner, or email...'
                            className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) py-2 pl-9 pr-3 text-sm text-(--text-main) placeholder:text-(--text-sub)/60 focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                        />
                    </div>
                </div>

                {isLoading ?
                    <p className='py-10 text-center text-sm text-(--text-sub)'>
                        Loading companies...
                    </p>
                : filtered.length === 0 ?
                    <div className='mt-6 rounded-lg border border-dashed border-(--border-line) p-10 text-center'>
                        <Building2
                            size={36}
                            strokeWidth={1.25}
                            className='mx-auto text-(--text-sub)'
                            aria-hidden='true'
                        />
                        <p className='mt-3 text-sm font-medium text-(--text-main)'>
                            No companies in this view
                        </p>
                        <p className='mt-1 text-xs text-(--text-sub)'>
                            Try a different status or search.
                        </p>
                    </div>
                :   <div className='mt-6 grid gap-3 md:grid-cols-2'>
                        {filtered.map((company) => (
                            <Link
                                key={company.id}
                                to={`/admin/companies/${company.id}`}
                                className='group rounded-lg border border-(--border-line) bg-(--bg-canvas) p-5 transition-colors hover:border-(--text-main)'>
                                <div className='flex items-start justify-between gap-3'>
                                    <div className='min-w-0'>
                                        <h2 className='font-grotesque text-2xl font-bold leading-tight text-(--text-main)'>
                                            {company.name}
                                        </h2>
                                        <p className='mt-1 text-xs text-(--text-sub)'>
                                            {company.owner.firstName}{' '}
                                            {company.owner.lastName} ·{' '}
                                            {company.owner.email}
                                        </p>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${statusClass(
                                            company.status
                                        )}`}>
                                        {company.status}
                                    </span>
                                </div>
                                <div className='mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-(--border-line) pt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-(--text-sub)'>
                                    <span className='inline-flex items-center gap-1'>
                                        <Users size={12} />
                                        {company.employeeCount ?? '—'} employees
                                    </span>
                                    <span className='inline-flex items-center gap-1'>
                                        <MapPin size={12} />
                                        {company._count.positions} positions
                                    </span>
                                    <span>
                                        {company._count.members} recruiter
                                        {company._count.members === 1 ? '' : 's'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                }
            </div>
        </div>
    );
}
