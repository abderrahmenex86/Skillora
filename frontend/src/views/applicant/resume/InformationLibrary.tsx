import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Award,
    Briefcase,
    ExternalLink,
    FolderGit2,
    GraduationCap,
    HeartHandshake,
    Languages,
    Link2,
    Plus,
    Trash2,
    type LucideIcon,
} from 'lucide-react';
import { apiClient } from '../../../api/apiClient';
import AddInformationModal from './AddInformationModal';
import {
    INFO_ENDPOINTS,
    INFO_KINDS,
    INFO_LABELS,
    INFO_SINGULAR_LABELS,
    describeInfo,
    emptyLibrary,
    getLibraryItems,
    type InfoKind,
    type VaultLibrary,
} from './types';

const SECTION_ICONS: Record<InfoKind, LucideIcon> = {
    education: GraduationCap,
    experience: Briefcase,
    project: FolderGit2,
    certification: Award,
    volunteering: HeartHandshake,
    language: Languages,
    link: Link2,
};

export default function InformationLibrary() {
    const queryClient = useQueryClient();
    const [addKind, setAddKind] = useState<InfoKind | null>(null);
    const [error, setError] = useState('');

    const { data: vault = emptyLibrary(), isLoading } = useQuery({
        queryKey: ['applicant-vault'],
        queryFn: async () => {
            const { data } = await apiClient.get('/applicant/vault');
            return data.vault as VaultLibrary;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async ({
            kind,
            id,
        }: {
            kind: InfoKind;
            id: string;
        }) => {
            await apiClient.delete(
                `/applicant/vault/${INFO_ENDPOINTS[kind]}/${id}`
            );
        },
        onSuccess: () => {
            setError('');
            queryClient.invalidateQueries({
                queryKey: ['applicant-vault'],
            });
        },
        onError: (err: any) => {
            setError(
                err.response?.data?.error ||
                    'Could not remove this information.'
            );
        },
    });

    const totalItems = INFO_KINDS.reduce(
        (total, kind) => total + getLibraryItems(vault, kind).length,
        0
    );

    const handleDelete = (kind: InfoKind, id: string) => {
        const label = INFO_SINGULAR_LABELS[kind].toLowerCase();
        if (!window.confirm(`Remove this ${label} from your information?`)) {
            return;
        }
        deleteMutation.mutate({ kind, id });
    };

    return (
        <div className='space-y-6'>
            <div className='flex flex-col justify-between gap-3 border-b border-(--border-line) pb-5 sm:flex-row sm:items-end'>
                <div>
                    <h2 className='font-grotesque text-3xl font-bold text-(--text-main)'>
                        My Information
                    </h2>
                    <p className='mt-1 max-w-2xl text-sm text-(--text-sub)'>
                        Build your master library of diplomas, experience,
                        projects, links, certifications, volunteering, and
                        languages.
                    </p>
                </div>
                <span className='font-mono text-xs text-(--text-sub)'>
                    {totalItems} {totalItems === 1 ? 'item' : 'items'} saved
                </span>
            </div>

            {error && (
                <div className='rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600'>
                    {error}
                </div>
            )}

            {isLoading ?
                <div className='text-xs text-(--text-sub)'>
                    Loading your information...
                </div>
            :   <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                    {INFO_KINDS.map((kind) => {
                        const Icon = SECTION_ICONS[kind];
                        const items = getLibraryItems(vault, kind);

                        return (
                            <section
                                key={kind}
                                className='rounded-lg border border-(--border-line) bg-(--bg-canvas)'>
                                <div className='flex items-center justify-between gap-3 border-b border-(--border-line) px-4 py-3'>
                                    <div className='flex items-center gap-2'>
                                        <Icon
                                            size={17}
                                            className='text-(--text-sub)'
                                        />
                                        <h3 className='font-grotesque text-xl font-bold text-(--text-main)'>
                                            {INFO_LABELS[kind]}
                                        </h3>
                                        <span className='font-mono text-[10px] text-(--text-sub)'>
                                            {items.length}
                                        </span>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={() => setAddKind(kind)}
                                        className='inline-flex items-center gap-1 rounded border border-(--border-line) px-2.5 py-1.5 text-[11px] font-medium text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                        <Plus size={13} />
                                        Add
                                    </button>
                                </div>

                                <div className='space-y-2.5 p-4'>
                                    {items.length === 0 ?
                                        <div className='rounded border border-dashed border-(--border-line) px-3 py-5 text-center text-xs text-(--text-sub)'>
                                            No {INFO_LABELS[kind].toLowerCase()}{' '}
                                            added yet.
                                        </div>
                                    :   items.map((item) => {
                                            const info = describeInfo(
                                                kind,
                                                item
                                            );
                                            return (
                                                <div
                                                    key={item.id}
                                                    className='group rounded-md border border-(--border-line) bg-(--bg-panel) p-3'>
                                                    <div className='flex items-start justify-between gap-3'>
                                                        <div className='min-w-0'>
                                                            <div className='text-sm font-semibold text-(--text-main)'>
                                                                {info.title}
                                                            </div>
                                                            {info.subtitle && (
                                                                <div className='mt-0.5 text-xs text-(--text-sub)'>
                                                                    {
                                                                        info.subtitle
                                                                    }
                                                                </div>
                                                            )}
                                                            {info.description && (
                                                                <p className='mt-1 line-clamp-2 text-xs leading-relaxed text-(--text-sub)'>
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
                                                                                    className='rounded border border-(--border-line) px-1.5 py-0.5 font-mono text-[10px] text-(--text-sub)'>
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
                                                                            11
                                                                        }
                                                                    />
                                                                </a>
                                                            )}
                                                        </div>
                                                        <button
                                                            type='button'
                                                            onClick={() =>
                                                                handleDelete(
                                                                    kind,
                                                                    item.id
                                                                )
                                                            }
                                                            disabled={
                                                                deleteMutation.isPending
                                                            }
                                                            aria-label={`Remove ${INFO_SINGULAR_LABELS[kind]}`}
                                                            className='rounded p-1 text-(--text-sub) opacity-0 transition-all hover:bg-red-500/10 hover:text-red-600 group-hover:opacity-100 disabled:opacity-40'>
                                                            <Trash2
                                                                size={14}
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </section>
                        );
                    })}
                </div>
            }

            {addKind && (
                <AddInformationModal
                    kind={addKind}
                    onClose={() => setAddKind(null)}
                />
            )}
        </div>
    );
}
