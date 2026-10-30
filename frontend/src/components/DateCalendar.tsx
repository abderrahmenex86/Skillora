import {
    useEffect,
    useRef,
    useState,
    type KeyboardEvent,
} from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../lib/dateTime';

interface DateCalendarProps {
    value: string;
    onChange: (value: string) => void;
    min?: string;
    max?: string;
    disabledDate?: (date: Date) => boolean;
    label: string;
    id: string;
}

function toIso(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function fromIso(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function monthKey(date: Date) {
    return { year: date.getFullYear(), month: date.getMonth() };
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function DateCalendar({
    value,
    onChange,
    min,
    max,
    disabledDate,
    label,
    id,
}: DateCalendarProps) {
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(
        monthKey(value ? fromIso(value) : new Date())
    );
    const [focusIso, setFocusIso] = useState<string | null>(value || null);
    const rootRef = useRef<HTMLDivElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    useEffect(() => {
        if (!open || !focusIso) return;

        const target = dialogRef.current?.querySelector<HTMLButtonElement>(
            `[data-date="${focusIso}"]`
        );
        target?.focus();
    }, [open, focusIso, visible]);

    const todayIso = toIso(new Date());
    const firstOfMonth = new Date(visible.year, visible.month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(
        visible.year,
        visible.month + 1,
        0
    ).getDate();
    const cells: Array<Date | null> = [
        ...Array<Date | null>(startOffset).fill(null),
        ...Array.from(
            { length: daysInMonth },
            (_, index) => new Date(visible.year, visible.month, index + 1)
        ),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const isDisabled = (date: Date) => {
        const iso = toIso(date);
        if (min && iso < min) return true;
        if (max && iso > max) return true;
        return disabledDate?.(date) ?? false;
    };

    const firstEnabledInMonth = (year: number, month: number) => {
        const days = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= days; day += 1) {
            const date = new Date(year, month, day);
            if (!isDisabled(date)) return toIso(date);
        }
        return null;
    };

    const moveFocus = (startIso: string, delta: number) => {
        let date = fromIso(startIso);
        for (let step = 0; step < 370; step += 1) {
            date = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate() + delta
            );
            if (!isDisabled(date)) return toIso(date);
        }
        return null;
    };

    const openCalendar = () => {
        if (open) {
            setOpen(false);
            return;
        }

        const preferred = value ? fromIso(value) : new Date();
        const preferredIso =
            value && !isDisabled(preferred) ?
                value
            :   firstEnabledInMonth(
                    preferred.getFullYear(),
                    preferred.getMonth()
                );

        setVisible(monthKey(preferred));
        setFocusIso(preferredIso);
        setOpen(true);
    };

    const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            triggerRef.current?.focus();
            return;
        }

        if (event.key === 'PageUp' || event.key === 'PageDown') {
            event.preventDefault();
            const delta = event.key === 'PageUp' ? -1 : 1;
            const targetMonth = new Date(
                visible.year,
                visible.month + delta,
                1
            );
            const targetIso = firstEnabledInMonth(
                targetMonth.getFullYear(),
                targetMonth.getMonth()
            );
            setVisible(monthKey(targetMonth));
            setFocusIso(targetIso);
            return;
        }

        if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            const days = new Date(
                visible.year,
                visible.month + 1,
                0
            ).getDate();
            const start = event.key === 'Home' ? 1 : days;
            const step = event.key === 'Home' ? 1 : -1;
            let targetIso: string | null = null;

            for (let day = start; day >= 1 && day <= days; day += step) {
                const date = new Date(visible.year, visible.month, day);
                if (!isDisabled(date)) {
                    targetIso = toIso(date);
                    break;
                }
            }

            if (targetIso) setFocusIso(targetIso);
            return;
        }

        const deltas: Record<string, number> = {
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: -7,
            ArrowDown: 7,
        };
        const delta = deltas[event.key];

        if (!delta || !focusIso) return;
        event.preventDefault();

        const next = moveFocus(focusIso, delta);
        if (!next) return;

        setFocusIso(next);
        setVisible(monthKey(fromIso(next)));
    };

    const monthLabel = new Intl.DateTimeFormat('en-GB', {
        month: 'long',
        year: 'numeric',
    }).format(firstOfMonth);

    return (
        <div
            ref={rootRef}
            className='relative'>
            <label
                htmlFor={`${id}-trigger`}
                className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                {label}
            </label>
            <button
                ref={triggerRef}
                id={`${id}-trigger`}
                type='button'
                onClick={openCalendar}
                aria-haspopup='dialog'
                aria-expanded={open}
                className='flex w-full items-center justify-between gap-2 rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-left text-sm text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                <span className={value ? '' : 'text-(--text-sub)/60'}>
                    {value ? formatDate(value) : 'Choose date'}
                </span>
                <CalendarDays
                    size={15}
                    className='shrink-0 text-(--text-sub)'
                    aria-hidden='true'
                />
            </button>

            {open && (
                <div
                    ref={dialogRef}
                    role='dialog'
                    aria-label={label}
                    onKeyDown={handleDialogKeyDown}
                    className='absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-(--border-line) bg-(--bg-canvas) p-3 shadow-xl'>
                    <div className='mb-2 flex items-center justify-between'>
                        <button
                            type='button'
                            aria-label='Previous month'
                            onClick={() => {
                                const date = new Date(
                                    visible.year,
                                    visible.month - 1,
                                    1
                                );
                                setVisible(monthKey(date));
                                setFocusIso(
                                    firstEnabledInMonth(
                                        date.getFullYear(),
                                        date.getMonth()
                                    )
                                );
                            }}
                            className='rounded-md p-1 text-(--text-sub) hover:bg-(--bg-panel) hover:text-(--text-main)'>
                            <ChevronLeft size={16} />
                        </button>
                        <span className='font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-(--text-main)'>
                            {monthLabel}
                        </span>
                        <button
                            type='button'
                            aria-label='Next month'
                            onClick={() => {
                                const date = new Date(
                                    visible.year,
                                    visible.month + 1,
                                    1
                                );
                                setVisible(monthKey(date));
                                setFocusIso(
                                    firstEnabledInMonth(
                                        date.getFullYear(),
                                        date.getMonth()
                                    )
                                );
                            }}
                            className='rounded-md p-1 text-(--text-sub) hover:bg-(--bg-panel) hover:text-(--text-main)'>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className='grid grid-cols-7 gap-1'>
                        {WEEKDAYS.map((weekday) => (
                            <span
                                key={weekday}
                                className='py-1 text-center font-mono text-[8px] uppercase tracking-[0.08em] text-(--text-sub)'>
                                {weekday}
                            </span>
                        ))}
                        {cells.map((date, index) => {
                            if (!date) {
                                return <span key={`empty-${index}`} />;
                            }
                            const iso = toIso(date);
                            const disabled = isDisabled(date);
                            const selected = value === iso;
                            const isToday = iso === todayIso;

                            return (
                                <button
                                    key={iso}
                                    type='button'
                                    data-date={iso}
                                    disabled={disabled}
                                    aria-disabled={disabled}
                                    aria-selected={selected}
                                    aria-current={
                                        isToday ? 'date' : undefined
                                    }
                                    aria-label={formatDate(date)}
                                    tabIndex={iso === focusIso ? 0 : -1}
                                    onClick={() => {
                                        if (disabled) return;
                                        onChange(iso);
                                        setOpen(false);
                                        triggerRef.current?.focus();
                                    }}
                                    className={`h-8 rounded-md text-center text-xs transition-colors ${
                                        disabled ?
                                            'cursor-not-allowed text-(--text-sub)/40 line-through'
                                        : selected ?
                                            'bg-(--btn-main-bg) font-semibold text-(--btn-main-text)'
                                        : isToday ?
                                            'border border-(--text-main) text-(--text-main) hover:bg-(--bg-panel)'
                                        :   'text-(--text-main) hover:bg-(--bg-panel)'
                                    }`}>
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export function TimeField({
    value,
    onChange,
    label,
    id,
}: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    id: string;
}) {
    return (
        <label
            htmlFor={id}
            className='block'>
            <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                {label}
            </span>
            <input
                id={id}
                type='time'
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3 py-2 text-sm text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
            />
        </label>
    );
}
