import { useState } from 'react';
import {
    FileQuestion,
    LayoutDashboard,
    RefreshCw,
    ServerCrash,
    TriangleAlert,
    WifiOff,
    type LucideIcon,
} from 'lucide-react';
import { queryClient } from '../api/queryClient';
import { roleHome } from '../data/routes';
import { useAuthStore } from '../store/useAuthStore';
import {
    ERROR_CONTEXTS,
    ERROR_ORDER,
    describeError,
    type ErrorKind,
} from '../lib/errors';

interface ErrorScreenProps {
    kind: ErrorKind;
    error?: unknown;
    onRetry?: () => void;
    onReturnToDashboard?: () => void;
}

const KIND_ICONS = {
    'not-found': FileQuestion,
    'server-error': ServerCrash,
    network: WifiOff,
    runtime: TriangleAlert,
} satisfies Record<ErrorKind, LucideIcon>;

function createReference() {
    return `SK-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
    return (
        <div className='grid grid-cols-[7.5rem_1fr] gap-4 px-5 py-3'>
            <dt className='font-mono text-[10px] uppercase tracking-[0.16em] text-muted'>
                {label}
            </dt>
            <dd className='font-mono text-[11px] leading-relaxed text-ink'>
                {value}
            </dd>
        </div>
    );
}

export default function ErrorScreen({
    kind,
    error,
    onRetry,
    onReturnToDashboard,
}: ErrorScreenProps) {
    const user = useAuthStore((state) => state.user);
    const [reference] = useState(createReference);
    const [isRetrying, setIsRetrying] = useState(false);

    const context = ERROR_CONTEXTS[kind];
    const Icon = KIND_ICONS[kind];
    const retryIsPrimary = kind !== 'not-found';

    const detail =
        describeError(error) ||
        (kind === 'not-found' ? `PATH ${window.location.pathname}` : '');

    const handleReturn = () => {
        if (onReturnToDashboard) {
            onReturnToDashboard();
            return;
        }
        window.location.assign(user ? roleHome[user.role] : '/');
    };

    const handleRetry = () => {
        if (isRetrying) return;
        setIsRetrying(true);

        try {
            if (onRetry) {
                onRetry();
            } else {
                queryClient.invalidateQueries();
                window.location.reload();
            }
        } finally {
            window.setTimeout(() => setIsRetrying(false), 800);
        }
    };

    const primaryClass =
        'inline-flex items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50';
    const secondaryClass =
        'inline-flex items-center justify-center gap-2 rounded-md border border-hairline bg-white px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-chalk disabled:cursor-not-allowed disabled:opacity-50';

    return (
        <div className='min-h-dvh flex flex-col bg-white text-ink font-sans'>
            <header className='border-b border-hairline'>
                <div className='mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6'>
                    <a
                        href='/'
                        className='inline-flex items-center rounded-sm bg-ink px-3 py-1 font-grotesque text-3xl font-bold tracking-tight text-white'>
                        Skillora
                    </a>
                    <div className='flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted'>
                        <span className='h-1.5 w-1.5 rounded-full bg-amber-accent' />
                        System status · degraded
                    </div>
                </div>
            </header>

            <main
                aria-labelledby='error-heading'
                className='mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-start gap-10 px-6 py-12 lg:grid-cols-12 lg:gap-16 lg:py-16'>
                <section className='lg:col-span-7'>
                    <div className='flex flex-wrap items-center gap-3'>
                        <span className='inline-flex items-center gap-2 border border-ink px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink'>
                            <Icon
                                size={13}
                                strokeWidth={2.2}
                            />
                            [{context.code}]
                        </span>
                        <span className='font-mono text-[11px] uppercase tracking-[0.18em] text-muted'>
                            {context.label}
                        </span>
                    </div>

                    <h1
                        id='error-heading'
                        className='mt-7 font-grotesque text-5xl font-extrabold leading-[0.95] tracking-tight text-ink sm:text-6xl xl:text-7xl'>
                        {context.heading}
                    </h1>

                    <p className='mt-6 max-w-xl text-base leading-relaxed text-muted'>
                        {context.description}
                    </p>

                    <div className='mt-9 flex flex-col gap-3 sm:flex-row'>
                        <button
                            type='button'
                            onClick={handleReturn}
                            className={
                                retryIsPrimary ? secondaryClass : primaryClass
                            }>
                            <LayoutDashboard size={15} />
                            Return to Dashboard
                        </button>
                        <button
                            type='button'
                            onClick={handleRetry}
                            disabled={isRetrying}
                            aria-busy={isRetrying}
                            className={
                                retryIsPrimary ? primaryClass : secondaryClass
                            }>
                            <RefreshCw
                                size={15}
                                className={isRetrying ? 'animate-spin' : ''}
                            />
                            {isRetrying ? 'Retrying...' : 'Try Again'}
                        </button>
                    </div>

                    <div className='mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-hairline pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted'>
                        <span>Ref {reference}</span>
                        <span className='max-w-full truncate'>
                            Route {window.location.pathname}
                        </span>
                        <span>
                            Session {new Date().toISOString().slice(0, 10)}
                        </span>
                    </div>
                </section>

                <aside
                    aria-label='Error breakdown'
                    className='w-full border border-hairline lg:col-span-5'>
                    <div className='flex items-center justify-between border-b border-hairline px-5 py-3'>
                        <span className='font-mono text-[10px] uppercase tracking-[0.18em] text-muted'>
                            Error breakdown
                        </span>
                        <span className='font-mono text-[10px] uppercase tracking-[0.18em] text-ink'>
                            {context.code}
                        </span>
                    </div>

                    <dl className='divide-y divide-hairline'>
                        <BreakdownRow
                            label='Classification'
                            value={context.classification}
                        />
                        <BreakdownRow
                            label='HTTP status'
                            value={context.httpStatus}
                        />
                        <BreakdownRow
                            label='Impact scope'
                            value={context.scope}
                        />
                        <BreakdownRow
                            label='Recovery'
                            value={context.recovery}
                        />
                    </dl>

                    <div className='border-t border-hairline px-5 py-4'>
                        <div className='mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted'>
                            Known failure classes
                        </div>
                        <ul className='space-y-1.5'>
                            {ERROR_ORDER.map((errorKind) => {
                                const isActive = errorKind === kind;
                                const entry = ERROR_CONTEXTS[errorKind];

                                return (
                                    <li
                                        key={errorKind}
                                        className={`flex items-center gap-2 font-mono text-[11px] ${
                                            isActive ? 'text-ink' : 'text-muted'
                                        }`}>
                                        <span
                                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                                isActive ?
                                                    'bg-amber-accent'
                                                :   'bg-hairline'
                                            }`}
                                        />
                                        <span
                                            className={
                                                isActive ? 'font-semibold' : ''
                                            }>
                                            {entry.code}
                                        </span>
                                        <span className='truncate'>
                                            {entry.label}
                                        </span>
                                        {isActive && (
                                            <span className='ml-auto text-[9px] uppercase tracking-[0.16em] text-muted'>
                                                active
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {detail && (
                        <div className='border-t border-hairline px-5 py-4'>
                            <div className='mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted'>
                                <span>Diagnostic</span>
                                <span>read-only</span>
                            </div>
                            <pre className='max-h-28 overflow-auto whitespace-pre-wrap break-words border border-hairline bg-chalk p-3 font-mono text-[11px] leading-relaxed text-ink'>
                                {detail}
                            </pre>
                        </div>
                    )}
                </aside>
            </main>

            <footer className='border-t border-hairline'>
                <div className='mx-auto flex w-full max-w-6xl flex-col justify-between gap-1 px-6 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted sm:flex-row'>
                    <span>
                        Skillora Collective · Deterministic Hiring Protocol
                    </span>
                    <span>Error protocol · {reference}</span>
                </div>
            </footer>
        </div>
    );
}
