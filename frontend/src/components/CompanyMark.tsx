import { useState } from 'react';
import type { AlgerianCompany } from '../data/algerianCompanies';

const MONOGRAM_TONES = [
    'bg-neutral-900/5 text-neutral-900 ring-neutral-900/15 dark:bg-white/10 dark:text-neutral-100 dark:ring-white/20',
    'bg-neutral-800/5 text-neutral-800 ring-neutral-800/15 dark:bg-white/[0.08] dark:text-neutral-200 dark:ring-white/15',
    'bg-neutral-700/5 text-neutral-700 ring-neutral-700/20 dark:bg-white/[0.06] dark:text-neutral-300 dark:ring-white/10',
    'bg-neutral-600/5 text-neutral-700 ring-neutral-600/20 dark:bg-white/5 dark:text-neutral-300 dark:ring-white/10',
    'bg-neutral-500/5 text-neutral-700 ring-neutral-500/20 dark:bg-white/[0.04] dark:text-neutral-300 dark:ring-white/[0.08]',
    'bg-neutral-400/10 text-neutral-800 ring-neutral-400/25 dark:bg-white/[0.03] dark:text-neutral-200 dark:ring-white/[0.06]',
];

function monogramTone(name: string) {
    let hash = 0;

    for (let index = 0; index < name.length; index += 1) {
        hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
    }

    return MONOGRAM_TONES[hash % MONOGRAM_TONES.length];
}

/**
 * Company logo with a monogram fallback. Logos sit on a white chip so their
 * original colors remain legible in both themes.
 */
export default function CompanyMark({
    company,
}: {
    company: AlgerianCompany;
}) {
    const [failed, setFailed] = useState(false);

    if (!company.logo || failed) {
        return (
            <span
                className={`flex h-12 w-20 shrink-0 items-center justify-center rounded-md font-grotesque text-lg font-bold ring-1 ${monogramTone(company.name)}`}
                aria-hidden='true'>
                {company.monogram}
            </span>
        );
    }

    return (
        <span className='flex h-12 w-20 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white p-1.5'>
            <img
                src={company.logo}
                alt=''
                aria-hidden='true'
                className='max-h-full max-w-full object-contain'
                loading='lazy'
                decoding='async'
                onError={() => setFailed(true)}
            />
        </span>
    );
}
