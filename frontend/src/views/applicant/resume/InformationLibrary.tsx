import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Award,
    BookOpen,
    Briefcase,
    Car,
    ExternalLink,
    FilePlus2,
    FolderGit2,
    Gamepad2,
    GraduationCap,
    HeartHandshake,
    Languages,
    Link2,
    Megaphone,
    Palette,
    Plus,
    Presentation,
    Quote,
    Sparkles,
    Trash2,
    Trophy,
    Users,
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
    skill: Sparkles,
    language: Languages,
    certification: Award,
    conference: Presentation,
    creative: Palette,
    driving: Car,
    hobby: Gamepad2,
    honour: Trophy,
    network: Users,
    project: FolderGit2,
    publication: BookOpen,
    recommendation: Quote,
    social: Megaphone,
    volunteering: HeartHandshake,
    other: FilePlus2,
    link: Link2,
};

export default function InformationLibrary() {
    const queryClient = useQueryClient();
    const [addKind, setAddKind] = useState<InfoKind | null>(null);
    const [activeKind, setActiveKind] = useState<InfoKind | null>(null);
    const [error, setError] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<Partial<Record<InfoKind, HTMLElement | null>>>(
        {}
    );

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

    const sortedKinds = useMemo(() => {
        return [...INFO_KINDS].sort((a, b) => {
            const aHasItems = getLibraryItems(vault, a).length > 0;
            const bHasItems = getLibraryItems(vault, b).length > 0;

            if (aHasItems !== bHasItems) {
                return aHasItems ? -1 : 1;
            }

            return INFO_LABELS[a].localeCompare(INFO_LABELS[b]);
        });
    }, [vault]);

    const currentKind = activeKind ?? sortedKinds[0];

    const handleDelete = (kind: InfoKind, id: string) => {
        const label = INFO_SINGULAR_LABELS[kind].toLowerCase();
        if (!window.confirm(`Remove this ${label} from your information?`)) {
            return;
        }
        deleteMutation.mutate({ kind, id });
    };

    const scrollToKind = (kind: InfoKind) => {
        const container = scrollRef.current;
        const target = sectionRefs.current[kind];

        if (!container || !target) return;

        setActiveKind(kind);
        container.scrollTo({
            top: target.offsetTop,
            behavior: 'smooth',
        });
    };

    const handleScroll = () => {
        const container = scrollRef.current;
        if (!container) return;

        const position = container.scrollTop + 24;
        let nextKind = sortedKinds[0];

        for (const kind of sortedKinds) {
            const section = sectionRefs.current[kind];
            if (section && section.offsetTop <= position) {
                nextKind = kind;
            }
        }

        setActiveKind(nextKind);
    };

    return (
        <div className='flex h-full min-h-0 flex-col gap-4 overflow-y-auto md:overflow-hidden'>
            {error && (
                <div className='shrink-0 rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600'>
                    {error}
                </div>
            )}

            {isLoading ?
                <div className='text-xs text-(--text-sub)'>
                    Loading your information...
                </div>
            :   <div className='grid min-h-0 grid-cols-1 gap-5 md:flex-1 md:grid-cols-[220px_minmax(0,1fr)]'>
                    <nav className='rounded-lg border border-(--border-line) bg-(--bg-canvas) p-2 md:panel-scroll md:min-h-0'>
                        <div className='flex items-center justify-between px-2 pb-2 pt-1'>
                            <span className='font-mono text-[10px] uppercase tracking-wider text-(--text-sub)'>
                                Sections
                            </span>
                            <span className='font-mono text-[10px] text-(--text-sub)'>
                                {totalItems}{' '}
                                {totalItems === 1 ? 'item' : 'items'} saved
                            </span>
                        </div>

                        <div className='grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-1'>
                            {sortedKinds.map((kind) => {
                                const Icon = SECTION_ICONS[kind];
                                const count = getLibraryItems(
                                    vault,
                                    kind
                                ).length;
                                const isActive = kind === currentKind;

                                return (
                                    <button
                                        key={kind}
                                        type='button'
                                        onClick={() => scrollToKind(kind)}
                                        className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                                            isActive ?
                                                'bg-(--bg-panel) text-(--text-main)'
                                            :   'text-(--text-sub) hover:bg-(--bg-panel) hover:text-(--text-main)'
                                        }`}>
                                        <Icon
                                            size={15}
                                            className='shrink-0'
                                        />
                                        <span className='min-w-0 flex-1 truncate text-left'>
                                            {INFO_LABELS[kind]}
                                        </span>
                                        <span
                                            className={`font-mono text-[10px] ${
                                                count > 0 ?
                                                    'text-(--text-main)'
                                                :   'text-(--text-sub)'
                                            }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className='relative h-[65vh] min-h-[420px] snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth rounded-lg border border-(--border-line) bg-(--bg-canvas) md:h-auto md:min-h-0'>
                        {sortedKinds.map((kind) => {
                            const Icon = SECTION_ICONS[kind];
                            const items = getLibraryItems(vault, kind);

                            return (
                                <section
                                    key={kind}
                                    ref={(node) => {
                                        sectionRefs.current[kind] = node;
                                    }}
                                    className='snap-start scroll-mt-4 border-b border-(--border-line) last:border-b-0'>
                                    <div className='flex items-center justify-between gap-3 border-b border-(--border-line) px-4 py-3'>
                                        <div className='flex min-w-0 items-center gap-2'>
                                            <Icon
                                                size={17}
                                                className='shrink-0 text-(--text-sub)'
                                            />
                                            <h2 className='truncate font-grotesque text-xl font-bold text-(--text-main)'>
                                                {INFO_LABELS[kind]}
                                            </h2>
                                            <span className='font-mono text-[10px] text-(--text-sub)'>
                                                {items.length}
                                            </span>
                                        </div>
                                        <button
                                            type='button'
                                            onClick={() => setAddKind(kind)}
                                            className='inline-flex shrink-0 items-center gap-1 rounded border border-(--border-line) px-2.5 py-1.5 text-[11px] font-medium text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                            <Plus size={13} />
                                            Add
                                        </button>
                                    </div>

                                    <div className='space-y-2.5 p-4'>
                                        {items.length === 0 ?
                                            <div className='rounded border border-dashed border-(--border-line) px-3 py-8 text-center text-xs text-(--text-sub)'>
                                                No{' '}
                                                {INFO_LABELS[
                                                    kind
                                                ].toLowerCase()}{' '}
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
                                                                    {
                                                                        info.title
                                                                    }
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
