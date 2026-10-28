import {
    useEffect,
    useMemo,
    useState,
    type DragEvent,
    type KeyboardEvent,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Check,
    FileText,
    GripVertical,
    Plus,
    Save,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../api/apiClient';
import {
    DossierSketch,
    ResumeStackSketch,
    SearchSketch,
} from '../../../components/Sketches';
import { useAuthStore } from '../../../store/useAuthStore';
import {
    RESUME_INFO_KINDS,
    INFO_LABELS,
    countSelectedItems,
    describeInfo,
    draftToPayload,
    emptyDraft,
    emptyLibrary,
    getLibraryItem,
    getLibraryItems,
    resumeToDraft,
    type DragItem,
    type ResumeDraft,
    type ResumeInfoKind,
    type TailoredResume,
    type VaultItem,
    type VaultLibrary,
} from './types';

const MAX_FREE_RESUMES = 1;

function apiErrorMessage(err: any, fallback: string): string {
    if (err.response?.data?.issues) {
        return err.response.data.issues
            .map((issue: any) => issue.message)
            .join(' · ');
    }
    return err.response?.data?.error || fallback;
}

function parseSkills(value: string): string[] {
    return value
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);
}

function mergeSkills(current: string[], extra: string[]): string[] {
    const merged = [...current];
    extra.forEach((skill) => {
        if (!merged.some((item) => item.toLowerCase() === skill.toLowerCase())) {
            merged.push(skill);
        }
    });
    return merged;
}

export default function TailoredResumes({
    onOpenInformation,
}: {
    onOpenInformation: () => void;
}) {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);

    const [editingId, setEditingId] = useState<string | 'new' | null>(null);
    const [draft, setDraft] = useState<ResumeDraft>(emptyDraft);
    const [skillInput, setSkillInput] = useState('');
    const [search, setSearch] = useState('');
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [drag, setDrag] = useState<DragItem | null>(null);
    const [dropZone, setDropZone] = useState<'resume' | 'library' | null>(
        null
    );

    const { data: profiles = [], isLoading: profilesLoading } = useQuery({
        queryKey: ['applicant-profiles'],
        queryFn: async () => {
            const { data } = await apiClient.get('/applicant/profiles');
            return data.profiles as TailoredResume[];
        },
    });

    const { data: vault = emptyLibrary() } = useQuery({
        queryKey: ['applicant-vault'],
        queryFn: async () => {
            const { data } = await apiClient.get('/applicant/vault');
            return data.vault as VaultLibrary;
        },
    });

    useEffect(() => {
        if (editingId === 'new') return;

        if (profiles.length === 0) {
            if (editingId !== null) {
                setEditingId(null);
                setDraft(emptyDraft());
            }
            return;
        }

        if (!editingId || !profiles.some((profile) => profile.id === editingId)) {
            loadResume(profiles[0]);
        }
    }, [profiles, editingId]);

    const saveMutation = useMutation({
        mutationFn: async ({
            id,
            payload,
        }: {
            id: string | 'new';
            payload: ReturnType<typeof draftToPayload>;
        }) => {
            const response =
                id === 'new' ?
                    await apiClient.post('/applicant/profiles', payload)
                :   await apiClient.put(`/applicant/profiles/${id}`, payload);
            return response.data.profile as TailoredResume;
        },
        onSuccess: (saved) => {
            const normalized = {
                ...saved,
                selectedProjectIds:
                    saved.selectedProjectIds?.length ?
                        saved.selectedProjectIds
                    :   [],
            };
            queryClient.setQueryData(
                ['applicant-profiles'],
                (current: TailoredResume[] | undefined) => {
                    if (!current) return [normalized];
                    const exists = current.some(
                        (profile) => profile.id === normalized.id
                    );
                    if (!exists) return [normalized, ...current];
                    return current.map((profile) =>
                        profile.id === normalized.id ?
                            { ...normalized, _count: profile._count }
                        :   profile
                    );
                }
            );
            queryClient.invalidateQueries({
                queryKey: ['applicant-profiles'],
            });
            setEditingId(normalized.id);
            setDraft(resumeToDraft(normalized));
            setSkillInput('');
            setNotice('Resume saved.');
            setError('');
        },
        onError: (err: any) => {
            setError(
                apiErrorMessage(err, 'Could not save this tailored resume.')
            );
            setNotice('');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/applicant/profiles/${id}`);
            return id;
        },
        onSuccess: (deletedId) => {
            queryClient.setQueryData(
                ['applicant-profiles'],
                (current: TailoredResume[] | undefined) =>
                    (current || []).filter(
                        (profile) => profile.id !== deletedId
                    )
            );
            queryClient.invalidateQueries({
                queryKey: ['applicant-profiles'],
            });
            if (editingId === deletedId) {
                setEditingId(null);
                setDraft(emptyDraft());
            }
            setNotice('Resume deleted.');
            setError('');
        },
        onError: (err: any) => {
            setError(
                apiErrorMessage(err, 'Could not delete this tailored resume.')
            );
            setNotice('');
        },
    });

    function loadResume(profile: TailoredResume) {
        setEditingId(profile.id);
        setDraft(resumeToDraft(profile));
        setSkillInput('');
        setNotice('');
        setError('');
    }

    const isFree = user?.subscriptionTier === 'FREE';
    const limitReached = isFree && profiles.length >= MAX_FREE_RESUMES;

    const startNewResume = () => {
        if (limitReached) return;
        setEditingId('new');
        setDraft(emptyDraft());
        setSkillInput('');
        setSearch('');
        setNotice('');
        setError('');
    };

    const addItem = (kind: ResumeInfoKind, id: string) => {
        setDraft((current) => {
            if (current.selections[kind].includes(id)) return current;
            return {
                ...current,
                selections: {
                    ...current.selections,
                    [kind]: [...current.selections[kind], id],
                },
            };
        });
        setNotice('');
    };

    const removeItem = (kind: ResumeInfoKind, id: string) => {
        setDraft((current) => ({
            ...current,
            selections: {
                ...current.selections,
                [kind]: current.selections[kind].filter(
                    (selectedId) => selectedId !== id
                ),
            },
        }));
        setNotice('');
    };

    const toggleItem = (kind: ResumeInfoKind, id: string) => {
        if (draft.selections[kind].includes(id)) {
            removeItem(kind, id);
        } else {
            addItem(kind, id);
        }
    };

    const commitSkillInput = () => {
        const pending = parseSkills(skillInput);
        if (pending.length === 0) return;
        setDraft((current) => ({
            ...current,
            skills: mergeSkills(current.skills, pending),
        }));
        setSkillInput('');
        setNotice('');
    };

    const handleSkillKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            commitSkillInput();
            return;
        }
        if (
            event.key === 'Backspace' &&
            skillInput.length === 0 &&
            draft.skills.length > 0
        ) {
            setDraft((current) => ({
                ...current,
                skills: current.skills.slice(0, -1),
            }));
        }
    };

    const handleSave = () => {
        if (!editingId) return;

        const pendingSkills = parseSkills(skillInput);
        const draftToSave = {
            ...draft,
            skills: mergeSkills(draft.skills, pendingSkills),
        };

        if (pendingSkills.length > 0) {
            setDraft(draftToSave);
            setSkillInput('');
        }

        saveMutation.mutate({
            id: editingId,
            payload: draftToPayload(draftToSave),
        });
    };

    const handleDelete = (profile: TailoredResume) => {
        if (
            !window.confirm(
                `Delete "${profile.title}"? This tailored resume cannot be recovered.`
            )
        ) {
            return;
        }
        deleteMutation.mutate(profile.id);
    };

    const startDrag = (event: DragEvent<HTMLElement>, payload: DragItem) => {
        setDrag(payload);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData(
            'text/plain',
            `${payload.source}|${payload.kind}|${payload.id}`
        );
    };

    const readDrag = (event: DragEvent<HTMLElement>): DragItem | null => {
        if (drag) return drag;
        const serialized = event.dataTransfer.getData('text/plain');
        if (!serialized) return null;
        const [source, kind, id] = serialized.split('|');
        if (
            (source === 'library' || source === 'resume') &&
            RESUME_INFO_KINDS.includes(kind as ResumeInfoKind) &&
            id
        ) {
            return {
                source,
                kind: kind as ResumeInfoKind,
                id,
            };
        }
        return null;
    };

    const finishDrag = () => {
        setDrag(null);
        setDropZone(null);
    };

    const handleDropOnResume = (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        const payload = readDrag(event);
        if (payload?.source === 'library') {
            addItem(payload.kind, payload.id);
        }
        finishDrag();
    };

    const handleDropOnLibrary = (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        const payload = readDrag(event);
        if (payload?.source === 'resume') {
            removeItem(payload.kind, payload.id);
        }
        finishDrag();
    };

    const librarySections = useMemo(() => {
        const query = search.trim().toLowerCase();
        return RESUME_INFO_KINDS.map((kind) => {
            const items = getLibraryItems(vault, kind);
            if (!query) return { kind, items };
            return {
                kind,
                items: items.filter((item) => {
                    const info = describeInfo(kind, item);
                    return [
                        info.title,
                        info.subtitle,
                        info.description,
                        ...(info.tags || []),
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase()
                        .includes(query);
                }),
            };
        });
    }, [vault, search]);

    const visibleLibrarySections = librarySections.filter(
        (section) => section.items.length > 0
    );
    const totalLibraryItems = RESUME_INFO_KINDS.reduce(
        (total, kind) => total + getLibraryItems(vault, kind).length,
        0
    );

    const selectedSections = RESUME_INFO_KINDS.map((kind) => ({
        kind,
        items: draft.selections[kind]
            .map((id) => getLibraryItem(vault, kind, id))
            .filter((item): item is VaultItem => Boolean(item)),
    }));
    const visibleSelectedCount = selectedSections.reduce(
        (total, section) => total + section.items.length,
        0
    );
    const selectedCount = countSelectedItems(draft);

    return (
        <div className='flex h-full min-h-0 flex-col gap-4 overflow-y-auto lg:overflow-hidden'>
            <div className='flex shrink-0 flex-wrap items-stretch gap-2'>
                {profilesLoading ?
                    <div className='py-3 text-xs text-(--text-sub)'>
                        Loading resumes...
                    </div>
                :   profiles.map((profile) => {
                        const isActive = profile.id === editingId;
                        const itemCount = countSelectedItems(
                            resumeToDraft(profile)
                        );
                        return (
                            <div
                                key={profile.id}
                                className={`relative min-w-[220px] max-w-xs flex-1 rounded-lg border p-3 pr-9 transition-colors ${
                                    isActive ?
                                        'border-(--text-main) bg-(--bg-panel)'
                                    :   'border-(--border-line) bg-(--bg-canvas) hover:border-(--text-main)'
                                }`}>
                                <button
                                    type='button'
                                    onClick={() => loadResume(profile)}
                                    className='block w-full text-left'>
                                    <span className='block truncate text-sm font-semibold text-(--text-main)'>
                                        {profile.title}
                                    </span>
                                    <span className='mt-1 block font-mono text-[10px] text-(--text-sub)'>
                                        {itemCount}{' '}
                                        {itemCount === 1 ? 'item' : 'items'}
                                        {profile._count?.applications ?
                                            ` · ${profile._count.applications} ${
                                                profile._count.applications ===
                                                1 ?
                                                    'application'
                                                :   'applications'
                                            }`
                                        :   ''}
                                    </span>
                                </button>
                                <button
                                    type='button'
                                    onClick={() => handleDelete(profile)}
                                    disabled={deleteMutation.isPending}
                                    aria-label={`Delete ${profile.title}`}
                                    className='absolute right-2 top-2 rounded p-1 text-(--text-sub) transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40'>
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        );
                    })
                }

                <button
                    type='button'
                    onClick={startNewResume}
                    disabled={limitReached}
                    title={
                        limitReached ?
                            'Free accounts can keep one tailored resume'
                        :   'Create a tailored resume'
                    }
                    className='inline-flex min-w-[160px] items-center justify-center gap-2 rounded-lg border border-dashed border-(--border-line) px-4 py-3 text-xs font-semibold text-(--text-main) transition-colors hover:border-(--text-main) hover:bg-(--bg-panel) disabled:cursor-not-allowed disabled:opacity-40'>
                    <Plus size={14} />
                    New Resume
                </button>
            </div>

            {limitReached && (
                <div className='shrink-0 rounded border border-(--border-line) bg-(--bg-panel) px-3 py-2 text-xs text-(--text-sub)'>
                    Free accounts can keep one tailored resume.{' '}
                    <Link
                        to='/pricing'
                        className='font-medium text-(--text-main) underline'>
                        Choose a candidate pack
                    </Link>{' '}
                    to build a resume for every role.
                </div>
            )}

            {(notice || error) && (
                <div
                    className={`shrink-0 rounded border p-3 text-xs ${
                        error ?
                            'border-red-500/20 bg-red-500/10 text-red-600'
                        :   'border-forest/20 bg-forest/5 text-forest dark:text-forest-dark'
                    }`}>
                    {error || notice}
                </div>
            )}

            {!editingId ?
                <div className='flex flex-1 min-h-0 flex-col items-center justify-center overflow-y-auto rounded-lg border border-dashed border-(--border-line) bg-(--bg-canvas) px-6 py-16 text-center'>
                    <ResumeStackSketch className='mx-auto h-24 w-auto text-(--text-sub)' />
                    <h3 className='mt-3 font-grotesque text-2xl font-bold text-(--text-main)'>
                        {profiles.length === 0 ?
                            'Create your first tailored resume'
                        :   'Select a tailored resume'}
                    </h3>
                    <p className='mx-auto mt-1 max-w-md text-sm text-(--text-sub)'>
                        {profiles.length === 0 ?
                            'Your information stays organized in one place. Resumes only include what you choose for each role.'
                        :   'Choose a resume above to keep editing it.'}
                    </p>
                    {profiles.length === 0 && (
                        <button
                            type='button'
                            onClick={startNewResume}
                            disabled={limitReached}
                            className='mt-5 inline-flex items-center gap-2 rounded-md bg-(--btn-main-bg) px-5 py-2.5 text-sm font-semibold text-(--btn-main-text) transition-opacity hover:opacity-90 disabled:opacity-50'>
                            <Plus size={15} />
                            New Resume
                        </button>
                    )}
                </div>
            :   <div className='grid grid-cols-1 items-stretch gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-2'>
                    <section
                        onDragOver={(event) => {
                            event.preventDefault();
                            if (drag?.source === 'library') {
                                setDropZone('resume');
                            }
                        }}
                        onDragLeave={(event) => {
                            if (
                                !event.currentTarget.contains(
                                    event.relatedTarget as Node
                                )
                            ) {
                                setDropZone(null);
                            }
                        }}
                        onDrop={handleDropOnResume}
                        className={`flex min-h-0 flex-col rounded-lg border bg-(--bg-canvas) transition-shadow ${
                            dropZone === 'resume' ?
                                'border-(--text-main) ring-2 ring-(--text-main)/20'
                            :   'border-(--border-line)'
                        }`}>
                        <div className='flex shrink-0 items-center justify-between gap-3 border-b border-(--border-line) px-4 py-3'>
                            <div className='flex items-center gap-2'>
                                <FileText
                                    size={16}
                                    className='text-(--text-sub)'
                                />
                                <span className='font-mono text-[10px] uppercase tracking-wide text-(--text-sub)'>
                                    {editingId === 'new' ?
                                        'New tailored resume'
                                    :   'Current resume'}
                                </span>
                            </div>
                            <div className='flex items-center gap-2'>
                                <span className='font-mono text-[10px] text-(--text-sub)'>
                                    {visibleSelectedCount} of {selectedCount}{' '}
                                    items placed
                                </span>
                                <button
                                    type='button'
                                    onClick={handleSave}
                                    disabled={
                                        saveMutation.isPending ||
                                        draft.title.trim().length < 2
                                    }
                                    className='inline-flex items-center gap-1.5 rounded-md bg-(--btn-main-bg) px-3 py-1.5 text-xs font-semibold text-(--btn-main-text) transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40'>
                                    <Save size={13} />
                                    {saveMutation.isPending ?
                                        'Saving...'
                                    :   'Save Resume'}
                                </button>
                            </div>
                        </div>

                        <div className='panel-scroll flex-1 space-y-5 p-5'>
                            <div>
                                <label className='mb-1 block font-mono text-[10px] uppercase text-(--text-sub)'>
                                    Resume Title
                                </label>
                                <input
                                    value={draft.title}
                                    maxLength={120}
                                    onChange={(event) => {
                                        setDraft((current) => ({
                                            ...current,
                                            title: event.target.value,
                                        }));
                                        setNotice('');
                                    }}
                                    placeholder='e.g. Backend Engineer - TechCorp'
                                    className='w-full border-b border-(--border-line) bg-transparent pb-2 font-grotesque text-3xl font-extrabold text-(--text-main) placeholder:text-(--text-sub)/50 focus:border-(--text-main) focus:outline-none'
                                />
                            </div>

                            <div>
                                <label className='mb-1 block font-mono text-[10px] uppercase text-(--text-sub)'>
                                    Professional Summary
                                </label>
                                <textarea
                                    rows={4}
                                    maxLength={5000}
                                    value={draft.summary}
                                    onChange={(event) => {
                                        setDraft((current) => ({
                                            ...current,
                                            summary: event.target.value,
                                        }));
                                        setNotice('');
                                    }}
                                    placeholder='Write a short summary for this role. Focus on the experience and strengths that matter most.'
                                    className='w-full resize-y rounded-md border border-(--border-line) bg-(--bg-panel) px-3 py-2 text-sm leading-relaxed text-(--text-main) placeholder:text-(--text-sub)/60 focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                />
                            </div>

                            <div>
                                <label className='mb-1 block font-mono text-[10px] uppercase text-(--text-sub)'>
                                    Skills for this Resume
                                </label>
                                <div className='flex flex-wrap items-center gap-1.5 rounded-md border border-(--border-line) bg-(--bg-panel) px-2 py-2'>
                                    {draft.skills.map((skill) => (
                                        <span
                                            key={skill}
                                            className='inline-flex items-center gap-1 rounded border border-(--border-line) bg-(--bg-canvas) px-2 py-0.5 text-[11px] text-(--text-main)'>
                                            {skill}
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    setDraft((current) => ({
                                                        ...current,
                                                        skills: current.skills.filter(
                                                            (item) =>
                                                                item !== skill
                                                        ),
                                                    }))
                                                }
                                                aria-label={`Remove ${skill}`}
                                                className='text-(--text-sub) hover:text-(--text-main)'>
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        value={skillInput}
                                        maxLength={80}
                                        onChange={(event) =>
                                            setSkillInput(event.target.value)
                                        }
                                        onKeyDown={handleSkillKeyDown}
                                        onBlur={commitSkillInput}
                                        placeholder={
                                            draft.skills.length === 0 ?
                                                'Type a skill and press Enter'
                                            :   'Add another skill'
                                        }
                                        className='min-w-[150px] flex-1 bg-transparent px-1 py-0.5 text-xs text-(--text-main) placeholder:text-(--text-sub)/60 focus:outline-none'
                                    />
                                </div>
                            </div>

                            <div className='border-t border-(--border-line) pt-5'>
                                <div className='mb-3 flex items-center justify-between'>
                                    <span className='font-mono text-[10px] uppercase text-(--text-sub)'>
                                        Resume Sections
                                    </span>
                                    <span className='font-mono text-[10px] text-(--text-sub)'>
                                        Drag items here from the right
                                    </span>
                                </div>

                                {visibleSelectedCount === 0 ?
                                    <div className='rounded-md border border-dashed border-(--border-line) px-4 py-10 text-center text-xs text-(--text-sub)'>
                                        Drag information from the panel on the
                                        right to start building this resume.
                                    </div>
                                :   <div className='space-y-5'>
                                        {selectedSections
                                            .filter(
                                                (section) =>
                                                    section.items.length > 0
                                            )
                                            .map(({ kind, items }) => (
                                                <div key={kind}>
                                                    <h4 className='mb-2 font-mono text-[10px] uppercase tracking-wide text-(--text-sub)'>
                                                        {INFO_LABELS[kind]}
                                                    </h4>
                                                    <div className='space-y-2'>
                                                        {items.map((item) => {
                                                            const info =
                                                                describeInfo(
                                                                    kind,
                                                                    item
                                                                );
                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    draggable
                                                                    onDragStart={(
                                                                        event
                                                                    ) =>
                                                                        startDrag(
                                                                            event,
                                                                            {
                                                                                source: 'resume',
                                                                                kind,
                                                                                id: item.id,
                                                                            }
                                                                        )
                                                                    }
                                                                    onDragEnd={
                                                                        finishDrag
                                                                    }
                                                                    className='group flex cursor-grab items-start gap-2 rounded-md border border-(--border-line) bg-(--bg-panel) p-3 active:cursor-grabbing'>
                                                                    <GripVertical
                                                                        size={
                                                                            14
                                                                        }
                                                                        className='mt-0.5 shrink-0 text-(--text-sub)'
                                                                    />
                                                                    <div className='min-w-0 flex-1'>
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
                                                                            <p className='mt-1 line-clamp-3 text-xs leading-relaxed text-(--text-sub)'>
                                                                                {
                                                                                    info.description
                                                                                }
                                                                            </p>
                                                                        )}
                                                                        {info.tags &&
                                                                            info
                                                                                .tags
                                                                                .length >
                                                                                0 && (
                                                                                <div className='mt-1.5 flex flex-wrap gap-1'>
                                                                                    {info.tags.map(
                                                                                        (
                                                                                            tag
                                                                                        ) => (
                                                                                            <span
                                                                                                key={
                                                                                                    tag
                                                                                                }
                                                                                                className='rounded border border-(--border-line) px-1.5 py-0.5 font-mono text-[9px] text-(--text-sub)'>
                                                                                                {
                                                                                                    tag
                                                                                                }
                                                                                            </span>
                                                                                        )
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                    <button
                                                                        type='button'
                                                                        onClick={() =>
                                                                            removeItem(
                                                                                kind,
                                                                                item.id
                                                                            )
                                                                        }
                                                                        aria-label={`Remove ${info.title} from resume`}
                                                                        title='Remove from resume'
                                                                        className='rounded p-1 text-(--text-sub) opacity-0 transition-all hover:bg-red-500/10 hover:text-red-600 group-hover:opacity-100'>
                                                                        <X
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                }
                            </div>
                        </div>
                    </section>

                    <aside
                        onDragOver={(event) => {
                            event.preventDefault();
                            if (drag?.source === 'resume') {
                                setDropZone('library');
                            }
                        }}
                        onDragLeave={(event) => {
                            if (
                                !event.currentTarget.contains(
                                    event.relatedTarget as Node
                                )
                            ) {
                                setDropZone(null);
                            }
                        }}
                        onDrop={handleDropOnLibrary}
                        className={`flex min-h-0 flex-col rounded-lg border bg-(--bg-canvas) transition-shadow ${
                            dropZone === 'library' ?
                                'border-(--text-main) ring-2 ring-(--text-main)/20'
                            :   'border-(--border-line)'
                        }`}>
                        <div className='flex shrink-0 items-center justify-between gap-3 border-b border-(--border-line) px-4 py-3'>
                            <div>
                                <h3 className='font-grotesque text-xl font-bold text-(--text-main)'>
                                    Your Information
                                </h3>
                                <p className='mt-0.5 text-[11px] text-(--text-sub)'>
                                    Drag into the resume, or use the plus
                                    button.
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={onOpenInformation}
                                className='rounded border border-(--border-line) px-2.5 py-1.5 text-[11px] font-medium text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                Manage
                            </button>
                        </div>

                        <div className='panel-scroll panel-snap flex-1 space-y-4 p-4'>
                            <div className='relative'>
                                <Search
                                    size={14}
                                    className='absolute left-2.5 top-1/2 -translate-y-1/2 text-(--text-sub)'
                                />
                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder='Search your information...'
                                    className='w-full rounded-md border border-(--border-line) bg-(--bg-panel) py-2 pl-8 pr-3 text-xs text-(--text-main) placeholder:text-(--text-sub)/60 focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                />
                            </div>

                            {dropZone === 'library' && (
                                <div className='rounded border border-dashed border-(--text-main) bg-(--bg-panel) px-3 py-2 text-center text-[11px] text-(--text-main)'>
                                    Drop here to remove from the resume
                                </div>
                            )}

                            {totalLibraryItems === 0 ?
                                <div className='rounded-md border border-dashed border-(--border-line) px-4 py-10 text-center'>
                                    <DossierSketch className='mx-auto mb-2 h-16 w-auto text-(--text-sub)' />
                                    <p className='text-xs text-(--text-sub)'>
                                        Your information library is empty.
                                    </p>
                                    <button
                                        type='button'
                                        onClick={onOpenInformation}
                                        className='mt-3 rounded-md bg-(--btn-main-bg) px-4 py-2 text-xs font-semibold text-(--btn-main-text) transition-opacity hover:opacity-90'>
                                        Add Your Information
                                    </button>
                                </div>
                            : visibleLibrarySections.length === 0 ?
                                <div className='rounded-md border border-dashed border-(--border-line) px-4 py-8 text-center text-xs text-(--text-sub)'>
                                    <SearchSketch className='mx-auto mb-2 h-14 w-auto text-(--text-sub)' />
                                    No information matches "{search}".
                                </div>
                            :   <div className='space-y-4'>
                                    {visibleLibrarySections.map(
                                        ({ kind, items }) => (
                                            <div
                                                key={kind}
                                                className='snap-start'>
                                                <div className='mb-1.5 flex items-center justify-between'>
                                                    <h4 className='font-mono text-[10px] uppercase tracking-wide text-(--text-sub)'>
                                                        {INFO_LABELS[kind]}
                                                    </h4>
                                                    <span className='font-mono text-[9px] text-(--text-sub)'>
                                                        {items.length}
                                                    </span>
                                                </div>
                                                <div className='space-y-1.5'>
                                                    {items.map((item) => {
                                                        const selected =
                                                            draft.selections[
                                                                kind
                                                            ].includes(item.id);
                                                        const info =
                                                            describeInfo(
                                                                kind,
                                                                item
                                                            );
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                draggable={
                                                                    !selected
                                                                }
                                                                onDragStart={(
                                                                    event
                                                                ) =>
                                                                    startDrag(
                                                                        event,
                                                                        {
                                                                            source: 'library',
                                                                            kind,
                                                                            id: item.id,
                                                                        }
                                                                    )
                                                                }
                                                                onDragEnd={
                                                                    finishDrag
                                                                }
                                                                className={`group flex items-start gap-2 rounded-md border p-2.5 transition-colors ${
                                                                    selected ?
                                                                        'border-forest/30 bg-forest/5'
                                                                    :   'cursor-grab border-(--border-line) bg-(--bg-panel) hover:border-(--text-main) active:cursor-grabbing'
                                                                }`}>
                                                                <GripVertical
                                                                    size={14}
                                                                    className={`mt-0.5 shrink-0 ${
                                                                        selected ?
                                                                            'text-forest dark:text-forest-dark'
                                                                        :   'text-(--text-sub)'
                                                                    }`}
                                                                />
                                                                <div className='min-w-0 flex-1'>
                                                                    <div className='truncate text-xs font-semibold text-(--text-main)'>
                                                                        {
                                                                            info.title
                                                                        }
                                                                    </div>
                                                                    {info.subtitle && (
                                                                        <div className='mt-0.5 truncate text-[11px] text-(--text-sub)'>
                                                                            {
                                                                                info.subtitle
                                                                            }
                                                                        </div>
                                                                    )}
                                                                    {info.description && (
                                                                        <p className='mt-0.5 line-clamp-1 text-[11px] text-(--text-sub)'>
                                                                            {
                                                                                info.description
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    type='button'
                                                                    onClick={() =>
                                                                        toggleItem(
                                                                            kind,
                                                                            item.id
                                                                        )
                                                                    }
                                                                    aria-label={
                                                                        selected ?
                                                                            `Remove ${info.title} from resume`
                                                                        :   `Add ${info.title} to resume`
                                                                    }
                                                                    title={
                                                                        selected ?
                                                                            'Remove from resume'
                                                                        :   'Add to resume'
                                                                    }
                                                                    className={`shrink-0 rounded p-1 transition-colors ${
                                                                        selected ?
                                                                            'text-forest dark:text-forest-dark hover:bg-red-500/10 hover:text-red-600'
                                                                        :   'text-(--text-sub) hover:bg-(--bg-panel) hover:text-(--text-main)'
                                                                    }`}>
                                                                    {selected ?
                                                                        <Check
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                    :   <Plus
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                    }
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            }
                        </div>
                    </aside>
                </div>
            }
        </div>
    );
}
