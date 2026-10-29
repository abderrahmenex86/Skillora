import { useId } from 'react';

/**
 * Skillora sketchbook language — hand-drawn geometric shapes.
 * Ink outlines (currentColor, so they flip in dark mode) with hatched or
 * offset washes in the deck palette, roughened by an SVG pencil filter.
 */

const EMERALD = '#10b981';
const AMBER = '#e08a1e';
const INK = 'currentColor';

type Tone = 'emerald' | 'amber' | 'ink';
const TONE: Record<Tone, string> = { emerald: EMERALD, amber: AMBER, ink: INK };

function SketchDefs({ id }: { id: string }) {
    return (
        <defs>
            <filter
                id={`${id}-rough`}
                x='-10%'
                y='-10%'
                width='120%'
                height='120%'>
                <feTurbulence
                    type='fractalNoise'
                    baseFrequency='0.035'
                    numOctaves='2'
                    seed='7'
                />
                <feDisplacementMap
                    in='SourceGraphic'
                    scale='2.6'
                />
            </filter>
            {(['emerald', 'amber', 'ink'] as Tone[]).map((tone) => (
                <pattern
                    key={tone}
                    id={`${id}-hatch-${tone}`}
                    width='7'
                    height='7'
                    patternUnits='userSpaceOnUse'
                    patternTransform='rotate(45)'>
                    <line
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='7'
                        stroke={TONE[tone]}
                        strokeWidth='1.7'
                        opacity={tone === 'ink' ? 0.55 : 0.9}
                    />
                </pattern>
            ))}
        </defs>
    );
}

type Fill = { kind: 'hatch' | 'wash'; tone: Tone } | null;

type TileSpec = {
    /** path or element builder for a 100×100 tile at (x, y) */
    d: (x: number, y: number) => string;
    fill: Fill;
};

const circle = (cx: number, cy: number, r: number) =>
    `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`;

// prettier-ignore
const TILES: TileSpec[] = [
    { d: (x, y) => circle(x + 50, y + 50, 42), fill: { kind: 'wash', tone: 'emerald' } },
    { d: (x, y) => `M${x + 8} ${y + 8}h84v84h-84Z M${x + 8} ${y + 92} A84 84 0 0 1 ${x + 92} ${y + 8}`, fill: { kind: 'hatch', tone: 'ink' } },
    { d: (x, y) => `M${x + 8} ${y + 62} A42 42 0 0 1 ${x + 92} ${y + 62}Z`, fill: { kind: 'hatch', tone: 'amber' } },

    { d: (x, y) => `M${x + 8} ${y + 8}H${x + 92}A84 84 0 0 1 ${x + 8} ${y + 92}Z`, fill: { kind: 'hatch', tone: 'emerald' } },
    { d: (x, y) => `${circle(x + 50, y + 50, 40)} ${circle(x + 50, y + 50, 12)}`, fill: null },
    { d: (x, y) => `M${x + 8} ${y + 92}L${x + 50} ${y + 10}L${x + 92} ${y + 92}Z`, fill: { kind: 'wash', tone: 'amber' } },

    { d: (x, y) => `M${x + 8} ${y + 8}A84 84 0 0 1 ${x + 92} ${y + 92}H${x + 8}Z`, fill: { kind: 'hatch', tone: 'amber' } },
    { d: (x, y) => `M${x + 8} ${y + 8}h84v84h-84Z ${circle(x + 50, y + 50, 22)}`, fill: { kind: 'wash', tone: 'emerald' } },
    { d: (x, y) => `M${x + 8} ${y + 8}H${x + 92}V${y + 92}A84 84 0 0 1 ${x + 8} ${y + 8}Z`, fill: { kind: 'hatch', tone: 'emerald' } },
];

/** 3 × 3 sketchbook page of shapes. Every tile turns a quarter on hover. */
export function GeoComposition({ className = '' }: { className?: string }) {
    const id = 'sk' + useId().replace(/[^a-zA-Z0-9]/g, '');
    const size = 300;
    return (
        <svg
            viewBox={`-6 -6 ${size + 12} ${size + 12}`}
            role='img'
            aria-label='Hand-drawn geometric pattern'
            className={`text-(--text-main) ${className}`}>
            <SketchDefs id={id} />
            {TILES.map((tile, i) => {
                const x = (i % 3) * 100;
                const y = Math.floor(i / 3) * 100;
                const path = tile.d(x, y);
                return (
                    <g
                        key={i}
                        className='geo-in'
                        style={{
                            animationDelay: `${i * 80}ms`,
                            transformBox: 'fill-box',
                            transformOrigin: 'center',
                        }}>
                        <g className='geo-tile'>
                            <rect
                                x={x}
                                y={y}
                                width={100}
                                height={100}
                                fill='transparent'
                            />
                            {tile.fill?.kind === 'wash' && (
                                <path
                                    d={path}
                                    fill={TONE[tile.fill.tone]}
                                    fillRule='evenodd'
                                    opacity={0.22}
                                    transform='translate(5 5)'
                                />
                            )}
                            {tile.fill?.kind === 'hatch' && (
                                <path
                                    d={path}
                                    fill={`url(#${id}-hatch-${tile.fill.tone})`}
                                    fillRule='evenodd'
                                    filter={`url(#${id}-rough)`}
                                />
                            )}
                            <path
                                d={path}
                                fill='none'
                                stroke={INK}
                                strokeWidth={2.2}
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                filter={`url(#${id}-rough)`}
                            />
                        </g>
                    </g>
                );
            })}
        </svg>
    );
}

export type ShapeKind = 'circle' | 'square' | 'triangle' | 'half' | 'quarter';
export type ShapeTone = 'emerald' | 'amber' | 'ink' | 'sage';

const SHAPE_PATHS: Record<ShapeKind, string> = {
    circle: circle(20, 20, 16),
    square: 'M4 4h32v32h-32Z',
    triangle: 'M4 36L20 4L36 36Z',
    half: 'M4 30A16 16 0 0 1 36 30Z',
    quarter: 'M4 36A32 32 0 0 1 36 4V36Z',
};

/** A single hand-drawn shape with an offset colour wash. */
export function Shape({
    kind,
    tone = 'emerald',
    size = 40,
    className = '',
}: {
    kind: ShapeKind;
    tone?: ShapeTone;
    size?: number;
    className?: string;
}) {
    const id = 'sk' + useId().replace(/[^a-zA-Z0-9]/g, '');
    const colour = tone === 'sage' ? 'var(--border-line)' : TONE[tone];
    const d = SHAPE_PATHS[kind];
    return (
        <svg
            width={size}
            height={size}
            viewBox='0 0 42 42'
            aria-hidden='true'
            className={`shrink-0 overflow-visible text-(--text-main) ${className}`}>
            <SketchDefs id={id} />
            <path
                d={d}
                fill={colour}
                opacity={tone === 'ink' ? 0.18 : 0.35}
                transform='translate(3.5 3.5)'
            />
            <path
                d={d}
                fill='none'
                stroke={INK}
                strokeWidth={size < 20 ? 3 : 2}
                strokeLinejoin='round'
                filter={`url(#${id}-rough)`}
            />
        </svg>
    );
}

/** Logo mark: hand-drawn square, quarter arc and a dot. */
export function LogoMark({ size = 30 }: { size?: number }) {
    const id = 'sk' + useId().replace(/[^a-zA-Z0-9]/g, '');
    return (
        <svg
            width={size}
            height={size}
            viewBox='0 0 36 36'
            aria-hidden='true'
            className='overflow-visible text-(--text-main)'>
            <SketchDefs id={id} />
            <path
                d='M4 32A28 28 0 0 1 32 4V32Z'
                fill={EMERALD}
                transform='translate(2 2)'
                opacity={0.9}
            />
            <path
                d='M4 4h28v28h-28Z M4 32A28 28 0 0 1 32 4'
                fill='none'
                stroke={INK}
                strokeWidth={2.4}
                strokeLinejoin='round'
                filter={`url(#${id}-rough)`}
            />
            <circle
                cx='11'
                cy='11'
                r='3.4'
                fill={AMBER}
            />
        </svg>
    );
}

/** Pencil scribble underline, sized to its parent word. */
export function Scribble({
    tone = 'emerald',
    className = '',
}: {
    tone?: 'emerald' | 'amber';
    className?: string;
}) {
    return (
        <svg
            viewBox='0 0 200 16'
            preserveAspectRatio='none'
            aria-hidden='true'
            className={`pointer-events-none absolute -bottom-2 left-0 h-3.5 w-full ${className}`}>
            <path
                d='M3 10 C 40 3, 90 3, 130 7 S 185 12, 197 5 M12 13 C 60 8, 120 9, 170 12'
                fill='none'
                stroke={TONE[tone]}
                strokeWidth='3'
                strokeLinecap='round'
                className='scribble-draw'
            />
        </svg>
    );
}

/** Small hand-drawn curved arrow for margin notes. */
export function HandArrow({ className = '' }: { className?: string }) {
    return (
        <svg
            viewBox='0 0 80 50'
            aria-hidden='true'
            className={`text-(--text-sub) ${className}`}>
            <path
                d='M4 6 C 20 40, 50 46, 72 30 M60 26 L73 29 L68 41'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
    );
}
