import { useEffect, useState } from 'react';

type TypewriterProps = {
    texts: string[];
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
 * Types each string in turn, holds it, erases it, then moves to the next one.
 * The animated copy is hidden from assistive technology; the full set of
 * perspectives is exposed once in a visually hidden node.
 */
export default function Typewriter({
    texts,
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
        if (texts.length === 0) {
            setDisplayed('');
            return;
        }

        if (reducedMotion) {
            setDisplayed(texts[0]);
            return;
        }

        let cancelled = false;
        let timer: number | undefined;
        let textIndex = 0;
        let characterIndex = 0;
        let deleting = false;

        const schedule = (callback: () => void, delay: number) => {
            timer = window.setTimeout(callback, delay);
        };

        const tick = () => {
            if (cancelled) return;

            const current = texts[textIndex];

            if (deleting) {
                characterIndex = Math.max(characterIndex - 1, 0);
                setDisplayed(current.slice(0, characterIndex));

                if (characterIndex === 0) {
                    deleting = false;
                    textIndex = (textIndex + 1) % texts.length;

                    if (!loop && textIndex === 0) return;

                    schedule(tick, 560);
                    return;
                }

                schedule(tick, eraseSpeed);
                return;
            }

            characterIndex += 1;
            setDisplayed(current.slice(0, characterIndex));

            if (characterIndex >= current.length) {
                if (!loop && textIndex === texts.length - 1) return;

                schedule(() => {
                    deleting = true;
                    tick();
                }, holdDuration);
                return;
            }

            schedule(tick, typeSpeed + Math.random() * 24);
        };

        setDisplayed('');
        schedule(tick, startDelay);

        return () => {
            cancelled = true;
            if (timer !== undefined) window.clearTimeout(timer);
        };
    }, [
        texts,
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
            <span className='sr-only'>{texts.join(' ')}</span>
            {showCursor && !reducedMotion && (
                <span
                    aria-hidden='true'
                    className={`typewriter-cursor ${cursorClassName}`}
                />
            )}
        </span>
    );
}
