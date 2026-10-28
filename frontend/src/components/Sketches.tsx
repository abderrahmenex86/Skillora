type SketchProps = {
    className?: string;
};

const accentAmber = 'var(--color-amber-accent, #c26738)';
const accentForest = 'var(--color-forest-dark, #258c5a)';
const borderLine = 'var(--border-line, #e5e5e5)';
const textSub = 'var(--text-sub, #555555)';

export function MatchPathSketch({ className = '' }: SketchProps) {
    return (
        <svg
            viewBox='0 0 440 210'
            fill='none'
            aria-hidden='true'
            focusable='false'
            className={className}>
            <g
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'>
                <rect
                    x='22'
                    y='28'
                    width='104'
                    height='132'
                    rx='7'
                />
                <path
                    d='M22 52h104'
                    stroke={borderLine}
                />
                <circle
                    cx='38'
                    cy='40'
                    r='5'
                    stroke={textSub}
                />
                <path
                    d='M50 37h50M50 44h32'
                    stroke={textSub}
                />
                <path
                    d='M36 70h54M36 82h68M36 94h62M36 106h46'
                    stroke={borderLine}
                />
                <rect
                    x='36'
                    y='122'
                    width='26'
                    height='10'
                    rx='2'
                    stroke={borderLine}
                />
                <rect
                    x='68'
                    y='122'
                    width='36'
                    height='10'
                    rx='2'
                    stroke={borderLine}
                />
                <path d='M146 94h16' />
                <path d='M156 89l6 5-6 5' />

                <rect
                    x='168'
                    y='28'
                    width='104'
                    height='132'
                    rx='7'
                    stroke={textSub}
                    strokeDasharray='5 5'
                />
                <path
                    d='M180 56h56'
                    stroke={textSub}
                />
                <circle
                    cx='187'
                    cy='77'
                    r='8'
                    stroke={accentForest}
                />
                <path
                    d='M183 77l2.5 2.5 5-5.5'
                    stroke={accentForest}
                />
                <path
                    d='M202 77h52'
                    stroke={borderLine}
                />
                <circle
                    cx='187'
                    cy='104'
                    r='8'
                    stroke={accentForest}
                />
                <path
                    d='M183 104l2.5 2.5 5-5.5'
                    stroke={accentForest}
                />
                <path
                    d='M202 104h42'
                    stroke={borderLine}
                />
                <circle
                    cx='187'
                    cy='131'
                    r='8'
                    stroke={textSub}
                />
                <path
                    d='M183 131h8'
                    stroke={textSub}
                />
                <path
                    d='M202 131h34'
                    stroke={borderLine}
                />

                <path d='M272 94h14' />
                <path
                    d='M286 61v96'
                    stroke={textSub}
                    strokeDasharray='4 4'
                />
                <path
                    d='M286 61h20'
                    stroke={accentForest}
                />
                <path
                    d='M300 57l6 4-6 4'
                    stroke={accentForest}
                />
                <path
                    d='M286 157h20'
                    stroke={accentAmber}
                />
                <path
                    d='M300 153l6 4-6 4'
                    stroke={accentAmber}
                />

                <rect
                    x='312'
                    y='28'
                    width='106'
                    height='62'
                    rx='7'
                    stroke={accentForest}
                />
                <path
                    d='M322 78h58'
                    stroke={borderLine}
                />
                <rect
                    x='312'
                    y='126'
                    width='106'
                    height='62'
                    rx='7'
                    stroke={accentAmber}
                    strokeDasharray='5 4'
                />
                <path
                    d='M322 158h68M322 170h48'
                    stroke={borderLine}
                />
                <circle
                    cx='403'
                    cy='39'
                    r='3'
                    fill={accentForest}
                    stroke='none'
                />
                <circle
                    cx='403'
                    cy='137'
                    r='3'
                    fill={accentAmber}
                    stroke='none'
                />

                <path
                    d='M22 198h396'
                    stroke={borderLine}
                    strokeDasharray='2 6'
                />
                <path
                    d='M14 28h8M18 24v8'
                    stroke={textSub}
                    opacity='0.5'
                />
                <path
                    d='M418 180h8M422 176v8'
                    stroke={textSub}
                    opacity='0.5'
                />
                <circle
                    cx='22'
                    cy='198'
                    r='2'
                    fill={textSub}
                    stroke='none'
                    opacity='0.6'
                />
                <circle
                    cx='418'
                    cy='198'
                    r='2'
                    fill={textSub}
                    stroke='none'
                    opacity='0.6'
                />
            </g>

            <g
                fontFamily='var(--font-mono)'
                fontSize='8'
                letterSpacing='1.2'>
                <text
                    x='180'
                    y='49'
                    fill={textSub}>
                    RUBRIC AUDIT
                </text>
                <text
                    x='322'
                    y='47'
                    fill={accentForest}>
                    INTERVIEW
                </text>
                <text
                    x='322'
                    y='145'
                    fill={accentAmber}>
                    GROWTH PATH
                </text>
                <text
                    x='298'
                    y='122'
                    fill={accentAmber}
                    fontSize='7'>
                    IF GAP
                </text>
            </g>

            <text
                x='322'
                y='68'
                fill='currentColor'
                fontFamily='var(--font-display)'
                fontSize='17'
                fontWeight='800'>
                94% MATCH
            </text>
        </svg>
    );
}

export function ResumeStackSketch({ className = '' }: SketchProps) {
    return (
        <svg
            viewBox='0 0 220 130'
            fill='none'
            aria-hidden='true'
            focusable='false'
            className={className}>
            <g
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'>
                <rect
                    x='54'
                    y='24'
                    width='82'
                    height='88'
                    rx='6'
                    stroke={borderLine}
                    transform='rotate(-4 95 68)'
                />
                <rect
                    x='70'
                    y='20'
                    width='84'
                    height='90'
                    rx='6'
                />
                <circle
                    cx='84'
                    cy='34'
                    r='4'
                    stroke={textSub}
                />
                <path
                    d='M94 31h44M94 38h30'
                    stroke={textSub}
                />
                <path
                    d='M82 54h60M82 64h52M82 74h58M82 84h38'
                    stroke={borderLine}
                />
                <path
                    d='M82 98h24'
                    stroke={accentAmber}
                    strokeWidth='3'
                />
                <circle
                    cx='158'
                    cy='95'
                    r='13'
                    stroke={accentAmber}
                />
                <path
                    d='M158 88v14M151 95h14'
                    stroke={accentAmber}
                />
                <path
                    d='M156 22l6-6M174 34l8-2M166 51l8 4'
                    stroke={borderLine}
                />
                <circle
                    cx='36'
                    cy='105'
                    r='2'
                    fill={textSub}
                    stroke='none'
                    opacity='0.5'
                />
            </g>
        </svg>
    );
}

export function SearchSketch({ className = '' }: SketchProps) {
    return (
        <svg
            viewBox='0 0 220 130'
            fill='none'
            aria-hidden='true'
            focusable='false'
            className={className}>
            <g
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'>
                <rect
                    x='34'
                    y='24'
                    width='100'
                    height='84'
                    rx='6'
                    stroke={borderLine}
                />
                <path
                    d='M48 42h42'
                    stroke={textSub}
                />
                <path
                    d='M48 56h62M48 68h50M48 80h34'
                    stroke={borderLine}
                />
                <path
                    d='M48 56h28'
                    stroke={accentAmber}
                    strokeWidth='3'
                />
                <circle
                    cx='144'
                    cy='78'
                    r='22'
                />
                <path d='M160 94l16 16' />
                <path
                    d='M131 62c-12 6-18 15-18 27'
                    stroke={borderLine}
                    strokeDasharray='4 5'
                />
                <path
                    d='M157 56c13 7 19 18 18 30'
                    stroke={borderLine}
                    strokeDasharray='4 5'
                />
                <path
                    d='M58 100l6-6M64 100l-6-6'
                    stroke={textSub}
                    opacity='0.5'
                />
                <circle
                    cx='198'
                    cy='32'
                    r='3'
                    fill={accentAmber}
                    stroke='none'
                />
            </g>
        </svg>
    );
}

export function DossierSketch({ className = '' }: SketchProps) {
    return (
        <svg
            viewBox='0 0 220 130'
            fill='none'
            aria-hidden='true'
            focusable='false'
            className={className}>
            <g
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'>
                <path d='M44 50h44l10 12h78v40a8 8 0 01-8 8H52a8 8 0 01-8-8V50z' />
                <path
                    d='M44 74h38l9 12h38l9-12h38'
                    stroke={borderLine}
                />
                <rect
                    x='76'
                    y='16'
                    width='68'
                    height='46'
                    rx='4'
                    stroke={textSub}
                />
                <path
                    d='M88 30h40M88 39h32M88 48h24'
                    stroke={borderLine}
                />
                <path
                    d='M110 62v10M106 68l4 4 4-4'
                    stroke={accentForest}
                />
                <path
                    d='M158 30h16M166 22v16'
                    stroke={accentAmber}
                />
                <circle
                    cx='192'
                    cy='100'
                    r='3'
                    fill={textSub}
                    stroke='none'
                    opacity='0.5'
                />
            </g>
        </svg>
    );
}

export function CalendarSketch({ className = '' }: SketchProps) {
    return (
        <svg
            viewBox='0 0 220 130'
            fill='none'
            aria-hidden='true'
            focusable='false'
            className={className}>
            <g
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'>
                <rect
                    x='42'
                    y='26'
                    width='104'
                    height='84'
                    rx='7'
                />
                <path
                    d='M42 50h104'
                    stroke={borderLine}
                />
                <path
                    d='M62 18v16M126 18v16'
                    stroke={textSub}
                />
                <circle
                    cx='62'
                    cy='18'
                    r='4'
                    fill='currentColor'
                    stroke='none'
                />
                <circle
                    cx='126'
                    cy='18'
                    r='4'
                    fill='currentColor'
                    stroke='none'
                />
                <rect
                    x='56'
                    y='62'
                    width='10'
                    height='8'
                    rx='1.5'
                    stroke={borderLine}
                />
                <rect
                    x='76'
                    y='62'
                    width='10'
                    height='8'
                    rx='1.5'
                    stroke={borderLine}
                />
                <rect
                    x='96'
                    y='62'
                    width='10'
                    height='8'
                    rx='1.5'
                    stroke={borderLine}
                />
                <rect
                    x='56'
                    y='80'
                    width='10'
                    height='8'
                    rx='1.5'
                    stroke={borderLine}
                />
                <rect
                    x='76'
                    y='80'
                    width='10'
                    height='8'
                    rx='1.5'
                    stroke={borderLine}
                />
                <circle
                    cx='120'
                    cy='84'
                    r='12'
                    stroke={accentAmber}
                />
                <circle
                    cx='166'
                    cy='88'
                    r='18'
                    stroke={textSub}
                />
                <path
                    d='M166 78v10l7 4'
                    stroke={textSub}
                />
                <path
                    d='M132 84h14'
                    stroke={accentAmber}
                    strokeDasharray='3 3'
                />
                <path
                    d='M188 42h8M192 38v8'
                    stroke={borderLine}
                />
            </g>
        </svg>
    );
}
