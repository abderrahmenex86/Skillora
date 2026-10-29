import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, X } from 'lucide-react';
import { apiClient } from '../api/apiClient';
import { useAuthStore } from '../store/useAuthStore';

type Message = {
    id: string;
    applicationId: string | null;
    kind: string;
    title: string;
    body: string;
    readAt: string | null;
    createdAt: string;
};

export default function MessagesMenu() {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const { data } = useQuery({
        queryKey: ['applicant-messages'],
        queryFn: async () => {
            const response = await apiClient.get('/applicant/messages');
            return response.data as {
                messages: Message[];
                unreadCount: number;
            };
        },
        enabled: user?.role === 'APPLICANT',
        refetchInterval: 30_000,
    });

    const messages = data?.messages ?? [];
    const unreadCount = data?.unreadCount ?? 0;

    const markRead = useMutation({
        mutationFn: async (messageId: string) => {
            await apiClient.patch(`/applicant/messages/${messageId}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applicant-messages'] });
        },
    });

    const markAllRead = useMutation({
        mutationFn: async () => {
            await apiClient.post('/applicant/messages/read-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applicant-messages'] });
        },
    });

    useEffect(() => {
        const media = window.matchMedia('(max-width: 639px)');
        const update = () => setIsMobile(media.matches);
        update();
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                !rootRef.current?.contains(target) &&
                !panelRef.current?.contains(target)
            ) {
                setOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    if (user?.role !== 'APPLICANT') return null;

    const panel = (
        <div
            ref={panelRef}
            role='dialog'
            aria-label='Messages'
            className={`z-[60] overflow-hidden rounded-lg border border-(--border-line) bg-(--bg-canvas) shadow-xl ${
                isMobile ?
                    'fixed inset-x-4 top-[4.5rem] max-h-[calc(100dvh-5.5rem)] w-auto'
                :   'absolute right-0 top-full mt-2 w-[22rem]'
            }`}>
            <div className='flex items-center justify-between border-b border-(--border-line) px-4 py-3'>
                <div>
                    <p className='font-mono text-[9px] uppercase tracking-[0.16em] text-(--text-sub)'>
                        Notifications
                    </p>
                    <p className='font-grotesque text-xl font-bold text-(--text-main)'>
                        Messages
                    </p>
                </div>
                <div className='flex items-center gap-1'>
                    {unreadCount > 0 && (
                        <button
                            type='button'
                            onClick={() => markAllRead.mutate()}
                            disabled={markAllRead.isPending}
                            className='inline-flex items-center gap-1.5 rounded-md border border-(--border-line) px-2.5 py-1.5 text-[10px] font-semibold text-(--text-main) transition-colors hover:bg-(--bg-panel) disabled:opacity-50'>
                            <CheckCheck
                                size={13}
                                aria-hidden='true'
                            />
                            Mark all read
                        </button>
                    )}
                    <button
                        type='button'
                        onClick={() => setOpen(false)}
                        aria-label='Close messages'
                        className='rounded-md p-1.5 text-(--text-sub) transition-colors hover:bg-(--bg-panel) hover:text-(--text-main) sm:hidden'>
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div
                className={`overflow-y-auto ${
                    isMobile ? 'max-h-[calc(100dvh-11rem)]' : 'max-h-96'
                }`}>
                {messages.length === 0 ?
                    <div className='px-4 py-10 text-center text-xs text-(--text-sub)'>
                        No messages yet. Updates on your applications will
                        appear here.
                    </div>
                :   messages.map((message) => (
                        <button
                            key={message.id}
                            type='button'
                            onClick={() =>
                                !message.readAt && markRead.mutate(message.id)
                            }
                            className={`block w-full border-b border-(--border-line) px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-(--bg-panel) ${
                                message.readAt ?
                                    'opacity-70'
                                :   'bg-forest/5'
                            }`}>
                            <div className='flex items-start justify-between gap-3'>
                                <span className='text-xs font-semibold text-(--text-main)'>
                                    {message.title}
                                </span>
                                {!message.readAt && (
                                    <span
                                        aria-label='Unread'
                                        className='mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-forest dark:bg-forest-dark'
                                    />
                                )}
                            </div>
                            <p className='mt-1 text-xs leading-relaxed text-(--text-sub)'>
                                {message.body}
                            </p>
                            <p className='mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-(--text-sub)'>
                                {new Date(message.createdAt).toLocaleString(
                                    [],
                                    {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    }
                                )}
                            </p>
                        </button>
                    ))
                }
            </div>
        </div>
    );

    return (
        <div
            ref={rootRef}
            className='relative'>
            <button
                type='button'
                onClick={() => setOpen((value) => !value)}
                aria-label={`Messages${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={open}
                aria-haspopup='dialog'
                className='relative rounded-md p-2 text-(--text-sub) transition-colors hover:bg-(--bg-panel) hover:text-(--text-main)'>
                <Bell
                    size={18}
                    aria-hidden='true'
                />
                {unreadCount > 0 && (
                    <span className='absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-forest px-1 font-mono text-[9px] font-bold text-white dark:bg-forest-dark'>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            {open && (isMobile ? createPortal(panel, document.body) : panel)}
        </div>
    );
}
