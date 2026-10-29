export const ALGERIA_TIME_ZONE = 'Africa/Algiers';

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: ALGERIA_TIME_ZONE,
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: ALGERIA_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: ALGERIA_TIME_ZONE,
});

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: ALGERIA_TIME_ZONE,
});

function asDate(value?: string | Date | null): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value?: string | Date | null): string {
    const date = asDate(value);
    return date ? dateTimeFormatter.format(date) : '—';
}

export function formatDate(value?: string | Date | null): string {
    const date = asDate(value);
    return date ? dateFormatter.format(date) : '—';
}

export function formatTime(value?: string | Date | null): string {
    const date = asDate(value);
    return date ? timeFormatter.format(date) : '—';
}

export function formatDateTimeRange(
    start?: string | Date | null,
    end?: string | Date | null
): string {
    if (!start || !end) return '—';
    return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

export function formatDeadline(
    value?: string | Date | null,
    now: Date = new Date()
): string {
    const date = asDate(value);
    if (!date) return 'Deadline not set';

    const key = dayKeyFormatter.format(date);
    if (key === dayKeyFormatter.format(now)) {
        return `Closes today, ${timeFormatter.format(date)}`;
    }

    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (key === dayKeyFormatter.format(tomorrow)) {
        return `Closes tomorrow, ${timeFormatter.format(date)}`;
    }

    return `Closes ${dateTimeFormatter.format(date)}`;
}

function algeriaParts(date: Date) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: ALGERIA_TIME_ZONE,
    }).formatToParts(date);

    const value = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? '';

    return {
        year: value('year'),
        month: value('month'),
        day: value('day'),
        hour: value('hour'),
        minute: value('minute'),
    };
}

export function toAlgeriaDateTimeLocal(value?: string | Date | null): string {
    const date = asDate(value);
    if (!date) return '';

    const parts = algeriaParts(date);
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function parseAlgeriaDateTime(value: string): Date | null {
    if (!value) return null;
    const date = new Date(`${value}:00+01:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}
