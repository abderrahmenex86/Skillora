import axios from 'axios';

export type ErrorKind = 'not-found' | 'server-error' | 'network' | 'runtime';

export interface ErrorContext {
    code: string;
    label: string;
    heading: string;
    description: string;
    classification: string;
    httpStatus: string;
    scope: string;
    recovery: string;
}

export const ERROR_CONTEXTS: Record<ErrorKind, ErrorContext> = {
    'not-found': {
        code: '404',
        label: 'Route Not Found',
        heading: 'This page is not part of the protocol.',
        description:
            'The address you requested is not mapped to any Skillora route. The link may be outdated, mistyped, or the page may have moved since it was shared.',
        classification: 'CLIENT / ROUTE RESOLUTION',
        httpStatus: '404 · no matching handler',
        scope: 'This navigation only',
        recovery: 'Verify the address or return to your dashboard.',
    },
    'server-error': {
        code: '500',
        label: 'Backend Unreachable',
        heading: 'The evaluation engine did not answer.',
        description:
            'Skillora reached the application server, but it returned an internal fault. Submitted applications, evaluations, and scheduled interviews remain unchanged.',
        classification: 'SERVER / INTERNAL FAULT',
        httpStatus: '5xx · upstream failure',
        scope: 'API requests',
        recovery:
            'Retry the request. If the fault persists, contact support.',
    },
    network: {
        code: 'OFFLINE',
        label: 'Network Disconnected',
        heading: 'The connection dropped mid-request.',
        description:
            'Your browser could not complete a request to Skillora. Nothing was submitted, and no evaluation was affected while the transport was down.',
        classification: 'TRANSPORT / NO RESPONSE',
        httpStatus: '— · request never completed',
        scope: 'This device and session',
        recovery: 'Check your connection, then retry the request.',
    },
    runtime: {
        code: 'CLIENT',
        label: 'Runtime Fault',
        heading: 'The interface hit an exception.',
        description:
            'An unhandled rendering error interrupted this screen. The fault has been isolated so the rest of the Skillora protocol remains stable.',
        classification: 'CLIENT / UNHANDLED EXCEPTION',
        httpStatus: '— · render aborted',
        scope: 'This interface session',
        recovery: 'Retry the render or return to your dashboard.',
    },
};

export const ERROR_ORDER: ErrorKind[] = [
    'not-found',
    'server-error',
    'network',
    'runtime',
];

function isOffline() {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function classifyError(error: unknown): ErrorKind {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 404) return 'not-found';
        if (typeof status === 'number' && status >= 500) return 'server-error';
        if (!error.response) return isOffline() ? 'network' : 'server-error';
    }

    if (isOffline()) return 'network';
    return 'runtime';
}

export function describeError(error: unknown): string {
    if (!error) return '';

    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const request =
            error.config ?
                `${error.config.method?.toUpperCase() ?? 'HTTP'} ${error.config.url ?? ''}`.trim()
            :   '';

        return [
            status ? `HTTP ${status}` : 'NO RESPONSE',
            request,
            error.message,
        ]
            .filter(Boolean)
            .join(' · ');
    }

    if (error instanceof Error) {
        return `${error.name}: ${error.message}`;
    }

    if (typeof error === 'string') return error;

    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}
