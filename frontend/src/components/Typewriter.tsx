import { useEffect, useState } from 'react';

type TypewriterProps = {
    text: string;
    typeSpeed?: number;
    eraseSpeed?: number;
    holdDuration?: number;
    startDelay?: number;
    loop?: boolean;
    showCursor?: boolean;
    className?: string;
    cursorClassName?: string;
};

/**
 * Types a string one character at a time, then erases it and starts over.
 * The full string is exposed to assistive technology, while the animated
 * copy is hidden from screen readers.
 */
export default function Typewriter({
    text,
    typeSpeed = 42,
    eraseSpeed = 18,
    holdDuration = 2600,
    startDelay = 0,
    loop = true,
    showCursor = true,
    className = '',
    cursorClassName = '',
}: TypewriterProps) {
    const [displayed, setDisplayed] = useState('');
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const syncPreference = () => setReducedMotion(media.matches);

        syncPreference();
        media.addEventListener('change', syncPreference);

        return () => media.removeEventListener('change', syncPreference);
    }, []);

    useEffect(() => {
        if (reducedMotion) {
            setDisplayed(text);
            return;
        }

        let cancelled = false;
        let timer: number | undefined;
        let index = 0;
        let deleting = false;

        const schedule = (callback: () => void, delay: number) => {
            timer = window.setTimeout(callback, delay);
        };

        const tick = () => {
            if (cancelled) return;

            if (deleting) {
                index = Math.max(index - 1, 0);
                setDisplayed(text.slice(0, index));

                if (index === 0) {
                    deleting = false;
                    schedule(tick, 560);
                    return;
                }

                schedule(tick, eraseSpeed);
                return;
            }

            index += 1;
            setDisplayed(text.slice(0, index));

            if (index >= text.length) {
                if (!loop) return;

                schedule(() => {
                    deleting = true;
                    tick();
                }, holdDuration);
                return;
            }

            // A little jitter keeps the two lines from feeling mechanical.
            schedule(tick, typeSpeed + Math.random() * 24);
        };

        setDisplayed('');
        schedule(tick, startDelay);

        return () => {
            cancelled = true;
            if (timer !== undefined) window.clearTimeout(timer);
        };
    }, [
        text,
        typeSpeed,
        eraseSpeed,
        holdDuration,
        startDelay,
        loop,
        reducedMotion,
    ]);

    return (
        <span className={className}>
            <span aria-hidden='true'>{displayed}</span>
            <span className='sr-only'>{text}</span>
            {showCursor && (
                <span
                    aria-hidden='true'
                    className={`typewriter-cursor ${cursorClassName}`}
                />
            )}
        </span>
    );
}
