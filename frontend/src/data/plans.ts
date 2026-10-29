export interface Plan {
    id: string;
    label: string;
    months: 1 | 6 | 12;
    price: number;
    monthlyPrice: number;
    savingsPercent: number;
    description: string;
    features: string[];
    recommended?: boolean;
}

export const CANDIDATE_MONTHLY_RATE = 999;
export const COMPANY_MONTHLY_RATE = 4999;

const dzdFormatter = new Intl.NumberFormat('en-US');

export function formatDzd(amount: number): string {
    return `${dzdFormatter.format(amount)} DZD`;
}

function savingsPercent(price: number, monthlyRate: number, months: number) {
    const baseline = monthlyRate * months;
    return Math.round((1 - price / baseline) * 100);
}

const CANDIDATE_FEATURES = [
    'Unlimited active resumes (Tech, Law, etc.)',
    'Unlimited monthly applications',
    'Personalized cross-round insights',
    'Priority scheduling agent routing',
];

const COMPANY_FEATURES = [
    'Post-deadline manual review & seat extension',
    'Autonomous document & repo parsing',
    'Autonomous calendar dispatch',
    'Automated respectful gap analysis',
];

export const CANDIDATE_PACKS: Plan[] = [
    {
        id: 'candidate-1-month',
        label: '1 Month',
        months: 1,
        price: 999,
        monthlyPrice: 999,
        savingsPercent: savingsPercent(999, CANDIDATE_MONTHLY_RATE, 1),
        description:
            'A focused month to build resumes and apply across every role you are targeting.',
        features: CANDIDATE_FEATURES,
    },
    {
        id: 'candidate-6-months',
        label: '6 Months',
        months: 6,
        price: 2999,
        monthlyPrice: Math.round(2999 / 6),
        savingsPercent: savingsPercent(2999, CANDIDATE_MONTHLY_RATE, 6),
        description:
            'For an active search that spans several hiring rounds and domains.',
        features: CANDIDATE_FEATURES,
        recommended: true,
    },
    {
        id: 'candidate-12-months',
        label: '12 Months',
        months: 12,
        price: 4999,
        monthlyPrice: Math.round(4999 / 12),
        savingsPercent: savingsPercent(4999, CANDIDATE_MONTHLY_RATE, 12),
        description:
            'The best value for candidates who want a full year of unlimited access.',
        features: CANDIDATE_FEATURES,
    },
];

export const COMPANY_PLANS: Plan[] = [
    {
        id: 'company-monthly',
        label: 'Monthly',
        months: 1,
        price: 4999,
        monthlyPrice: 4999,
        savingsPercent: savingsPercent(4999, COMPANY_MONTHLY_RATE, 1),
        description:
            'Full hiring pipeline access, billed month to month. Cancel anytime.',
        features: COMPANY_FEATURES,
    },
    {
        id: 'company-annual',
        label: 'Annual',
        months: 12,
        price: 45000,
        monthlyPrice: Math.round(45000 / 12),
        savingsPercent: savingsPercent(45000, COMPANY_MONTHLY_RATE, 12),
        description:
            'A full year of verified pipeline access at a lower monthly cost.',
        features: COMPANY_FEATURES,
        recommended: true,
    },
];
