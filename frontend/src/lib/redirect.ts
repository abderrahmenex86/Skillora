import type { Location } from 'react-router-dom';

const REDIRECT_STORAGE_KEY = 'skillora:redirect';

/**
 * Only allow same-origin, non-auth destinations so a crafted
 * `redirect` value cannot bounce the user to an external site.
 */
export function normalizeRedirect(
    value: string | null | undefined
): string | null {
    if (!value) return null;

    try {
        const url = new URL(value, window.location.origin);

        if (url.origin !== window.location.origin) return null;
        if (url.pathname.startsWith('/auth')) return null;

        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return null;
    }
}

export function redirectFromLocationState(state: unknown): string | null {
    if (!state || typeof state !== 'object' || !('from' in state)) {
        return null;
    }

    const from = (state as { from?: Location | string }).from;

    if (typeof from === 'string') return from;
    if (!from) return null;

    return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
}

export function consumeStoredRedirect(): string | null {
    try {
        const stored = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
        if (stored) sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
        return stored;
    } catch {
        return null;
    }
}
