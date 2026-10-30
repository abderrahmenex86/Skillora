import { useEffect, useRef, useState } from 'react';
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
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
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
                id={`${id}-trigger`}
                type='button'
                onClick={() => {
                    if (value) setVisible(monthKey(fromIso(value)));
                    setOpen((current) => !current);
                }}
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
                    role='dialog'
                    aria-label={label}
                    className='absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-(--border-line) bg-(--bg-canvas) p-3 shadow-xl'>
                    <div className='mb-2 flex items-center justify-between'>
                        <button
                            type='button'
                            aria-label='Previous month'
                            onClick={() =>
                                setVisible((current) => {
                                    const date = new Date(
                                        current.year,
                                        current.month - 1,
                                        1
                                    );
                                    return monthKey(date);
                                })
                            }
                            className='rounded-md p-1 text-(--text-sub) hover:bg-(--bg-panel) hover:text-(--text-main)'>
                            <ChevronLeft size={16} />
                        </button>
                        <span className='font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-(--text-main)'>
                            {monthLabel}
                        </span>
                        <button
                            type='button'
                            aria-label='Next month'
                            onClick={() =>
                                setVisible((current) => {
                                    const date = new Date(
                                        current.year,
                                        current.month + 1,
                                        1
                                    );
                                    return monthKey(date);
                                })
                            }
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
                                    aria-label={formatDate(date)}
                                    onClick={() => {
                                        if (disabled) return;
                                        onChange(iso);
                                        setOpen(false);
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
