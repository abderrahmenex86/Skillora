import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    ArrowUpRight,
    BadgeCheck,
    BarChart3,
    Building2,
    CalendarCheck2,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Copy,
    FileText,
    Mail,
    MapPin,
    Route,
    Search,
    Send,
    ShieldCheck,
    Sparkles,
    Target,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react';
import { ALGERIAN_COMPANIES } from '../../data/algerianCompanies';
import Typewriter from '../../components/Typewriter';
import { useAuthStore } from '../../store/useAuthStore';

const HERO_PREFIX = 'Hiring shouldn’t mean';
const HERO_PERSPECTIVES = [
    'waiting in silence with zero feedback.',
    'drowning in 500 CVs with zero real proof.',
];

type Feature = {
    icon: LucideIcon;
    title: string;
    description: string;
};

const APPLICANT_FEATURES: Feature[] = [
    {
        icon: Target,
        title: 'Evidence over keywords',
        description:
            'Your projects, degrees, and shipped work are matched against the real rubric — not a PDF keyword scan.',
    },
    {
        icon: Route,
        title: 'A roadmap, not a black hole',
        description:
            'Every application ends with an interview or a concrete list of gaps and the steps that close them.',
    },
    {
        icon: FileText,
        title: 'Resumes tailored in minutes',
        description:
            'Keep one information library and assemble a role-specific resume for every application.',
    },
    {
        icon: CalendarCheck2,
        title: 'Interviews that actually happen',
        description:
            'Confirm a slot without the email chain, then track every interview from one dashboard.',
    },
];

const RECRUITER_FEATURES: Feature[] = [
    {
        icon: ShieldCheck,
        title: 'Verified shortlists',
        description:
            'See what a candidate has actually built, shipped, or certified before the first call.',
    },
    {
        icon: Users,
        title: 'One pipeline per role',
        description:
            'Every applicant lands in a structured cohort with their evidence and gap analysis attached.',
    },
    {
        icon: CalendarCheck2,
        title: 'Scheduling without the back-and-forth',
        description:
            'Offer interview slots, collect confirmations, and keep the calendar in sync automatically.',
    },
    {
        icon: BarChart3,
        title: 'Cohort analytics',
        description:
            'Spot the criteria your pipeline keeps missing and fix the rubric before the next intake.',
    },
];

const CANDIDATES = [
    {
        id: 'DZ-308',
        match: 94,
        note: '3 verified repositories • ESI Algiers',
    },
    {
        id: 'DZ-142',
        match: 88,
        note: 'CAPA • 2 shipped APIs',
    },
    {
        id: 'DZ-097',
        match: 81,
        note: '1 certification gap',
    },
];

const CONTACT_ITEMS = [
    {
        icon: Mail,
        label: 'Email',
        value: 'contact@skillora.dz',
    },
    {
        icon: MapPin,
        label: 'Based in',
        value: 'Algiers, Algeria — remote across 58 wilayas',
    },
    {
        icon: Clock3,
        label: 'Response time',
        value: 'Within one business day',
    },
];

const COMPANY_PREVIEW_COUNT = 12;

const MONOGRAM_TONES = [
    'bg-neutral-900/5 text-neutral-900 ring-neutral-900/15 dark:bg-white/10 dark:text-neutral-100 dark:ring-white/20',
    'bg-neutral-800/5 text-neutral-800 ring-neutral-800/15 dark:bg-white/[0.08] dark:text-neutral-200 dark:ring-white/15',
    'bg-neutral-700/5 text-neutral-700 ring-neutral-700/20 dark:bg-white/[0.06] dark:text-neutral-300 dark:ring-white/10',
    'bg-neutral-600/5 text-neutral-700 ring-neutral-600/20 dark:bg-white/5 dark:text-neutral-300 dark:ring-white/10',
    'bg-neutral-500/5 text-neutral-700 ring-neutral-500/20 dark:bg-white/[0.04] dark:text-neutral-300 dark:ring-white/[0.08]',
    'bg-neutral-400/10 text-neutral-800 ring-neutral-400/25 dark:bg-white/[0.03] dark:text-neutral-200 dark:ring-white/[0.06]',
];

const PRIMARY_BUTTON =
    'inline-flex items-center justify-center gap-2 rounded-md bg-(--btn-main-bg) px-5 py-3 font-grotesque text-lg font-bold text-(--btn-main-text) transition-transform hover:-translate-y-0.5 hover:opacity-90';

const SECONDARY_BUTTON =
    'inline-flex items-center justify-center gap-2 rounded-md border border-(--border-line) px-5 py-3 font-grotesque text-lg font-bold text-(--text-main) transition-colors hover:bg-(--bg-panel)';

const TEXT_LINK =
    'inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-(--text-main) transition-colors hover:text-forest dark:hover:text-forest-dark';

const FIELD_CLASS =
    'w-full rounded-md border border-(--border-line) bg-(--bg-canvas) px-3.5 py-2.5 text-sm text-(--text-main) outline-none transition-colors placeholder:text-(--text-sub) focus:border-(--text-main)';

function monogramTone(name: string) {
    let hash = 0;

    for (let index = 0; index < name.length; index += 1) {
        hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
    }

    return MONOGRAM_TONES[hash % MONOGRAM_TONES.length];
}

function normalizeSearch(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function SectionHeading({
    index,
    label,
    title,
    description,
}: {
    index: string;
    label: string;
    title: string;
    description: string;
}) {
    return (
        <div className='max-w-2xl'>
            <div className='flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-(--text-sub)'>
                <span>{index}</span>
                <span
                    aria-hidden='true'
                    className='h-px w-8 bg-(--border-line)'
                />
                <span>{label}</span>
            </div>
            <h2 className='mt-4 font-grotesque text-4xl font-extrabold leading-[0.95] tracking-tight text-(--text-main) sm:text-5xl'>
                {title}
            </h2>
            <p className='mt-4 text-base leading-relaxed text-(--text-sub) sm:text-lg'>
                {description}
            </p>
        </div>
    );
}

function FeatureCard({ feature }: { feature: Feature }) {
    const Icon = feature.icon;

    return (
        <div className='group rounded-lg border border-(--border-line) bg-(--bg-canvas) p-5 transition-colors hover:border-(--text-sub)/40 hover:bg-(--bg-panel)'>
            <div className='flex h-10 w-10 items-center justify-center rounded-md border border-(--border-line) bg-(--bg-panel) text-(--text-main) transition-colors group-hover:border-(--text-sub)/40 group-hover:bg-(--bg-canvas)'>
                <Icon
                    size={18}
                    aria-hidden='true'
                />
            </div>
            <h3 className='mt-4 font-grotesque text-xl font-bold text-(--text-main)'>
                {feature.title}
            </h3>
            <p className='mt-1.5 text-sm leading-relaxed text-(--text-sub)'>
                {feature.description}
            </p>
        </div>
    );
}

export default function LandingView() {
    const user = useAuthStore((state) => state.user);
    const [companyQuery, setCompanyQuery] = useState('');
    const [showAllCompanies, setShowAllCompanies] = useState(false);
    const [copied, setCopied] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactRole, setContactRole] = useState('Recruiter');
    const [contactMessage, setContactMessage] = useState('');

    const filteredCompanies = useMemo(() => {
        const query = normalizeSearch(companyQuery.trim());

        if (!query) return ALGERIAN_COMPANIES;

        return ALGERIAN_COMPANIES.filter((company) =>
            [company.name, company.sector, company.city].some((value) =>
                normalizeSearch(value).includes(query)
            )
        );
    }, [companyQuery]);

    const isSearching = companyQuery.trim().length > 0;
    const visibleCompanies =
        isSearching || showAllCompanies ?
            filteredCompanies
        :   filteredCompanies.slice(0, COMPANY_PREVIEW_COUNT);

    const heroPrimaryCta =
        user?.role === 'RECRUITER' ? '/recruiter/positions'
        : user?.role === 'APPLICANT' ? '/jobs'
        : '/auth?mode=register';

    const heroPrimaryLabel =
        user?.role === 'RECRUITER' ? 'Recruiter Workspace'
        : user?.role === 'APPLICANT' ? 'Explore Jobs'
        : 'Get Started';

    const heroSecondaryCta = user ? '/jobs' : '/auth?mode=login';

    const heroSecondaryLabel =
        user ? 'Explore Jobs' : 'Sign In to Explore Jobs';

    const applicantPrimary =
        user?.role === 'APPLICANT' ? '/applicant/profiles'
        : user?.role === 'RECRUITER' ? '/jobs'
        : '/auth?mode=register&role=applicant';

    const applicantPrimaryLabel =
        user?.role === 'RECRUITER' ? 'Preview public jobs'
        : 'Build your resume';

    const applicantSecondary =
        user?.role === 'APPLICANT' ? '/jobs'
        : user?.role === 'RECRUITER' ? '/pricing'
        : '/auth?mode=login';

    const applicantSecondaryLabel =
        user?.role === 'APPLICANT' ? 'Browse open roles'
        : user?.role === 'RECRUITER' ? 'See hiring plans'
        : 'Sign in to explore';

    const recruiterPrimary =
        user?.role === 'RECRUITER' ? '/recruiter/positions'
        : user?.role === 'APPLICANT' ? '/jobs'
        : '/auth?mode=register&role=recruiter';

    const recruiterPrimaryLabel =
        user?.role === 'APPLICANT' ? 'Preview public jobs' : 'Open a position';

    const handleCopyEmail = async () => {
        try {
            await navigator.clipboard.writeText('contact@skillora.dz');
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            window.location.href = 'mailto:contact@skillora.dz';
        }
    };

    const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const subject = `[Skillora] ${contactRole} enquiry from ${contactName}`;
        const body = [
            `Name: ${contactName}`,
            `Email: ${contactEmail}`,
            `I am a: ${contactRole}`,
            '',
            contactMessage,
        ].join('\n');

        window.location.href = `mailto:contact@skillora.dz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    return (
        <div className='page-scroll'>
            <main className='mx-auto w-full max-w-7xl px-6'>
                {/* 1. Hero */}
                <section
                    id='home'
                    className='flex min-h-[calc(100dvh-8rem)] flex-col justify-center py-14 md:py-20'>
                    <div className='grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12'>
                        <div className='lg:col-span-7'>
                            <div className='flex flex-wrap items-center gap-3'>
                                <span className='inline-flex h-6 items-center gap-1.5 rounded-full border border-forest/25 bg-forest/8 px-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-forest dark:border-forest-dark/30 dark:bg-forest-dark/10 dark:text-forest-dark'>
                                    <span className='h-1.5 w-1.5 rounded-full bg-forest motion-safe:animate-pulse dark:bg-forest-dark' />
                                    Live in 58 wilayas
                                </span>
                                <span className='font-mono text-[10px] uppercase tracking-[0.2em] text-(--text-sub)'>
                                    Evidence-based hiring
                                </span>
                            </div>

                            <h1 className='mt-6 grid font-grotesque text-5xl font-extrabold leading-[0.95] tracking-tight text-(--text-main) sm:text-6xl md:text-7xl'>
                                {HERO_PERSPECTIVES.map((perspective) => (
                                    <span
                                        key={perspective}
                                        aria-hidden='true'
                                        className='invisible col-start-1 row-start-1'>
                                        {`${HERO_PREFIX} ${perspective}\u00A0`}
                                    </span>
                                ))}
                                <span className='col-start-1 row-start-1'>
                                    {HERO_PREFIX}{' '}
                                    <Typewriter
                                        texts={HERO_PERSPECTIVES}
                                        cursorClassName='text-forest dark:text-forest-dark'
                                    />
                                </span>
                            </h1>
                            <p className='mt-6 max-w-2xl text-lg leading-relaxed text-(--text-sub) md:text-xl'>
                                Skillora automates screening and scheduling
                                for employers while guaranteeing actionable
                                learning roadmaps to every applicant.
                            </p>

                            <div className='mt-8 flex flex-wrap items-center gap-3'>
                                <Link
                                    to={heroPrimaryCta}
                                    className={PRIMARY_BUTTON}>
                                    {heroPrimaryLabel}
                                    <ArrowRight
                                        size={18}
                                        aria-hidden='true'
                                    />
                                </Link>
                                <Link
                                    to={heroSecondaryCta}
                                    className={SECONDARY_BUTTON}>
                                    {heroSecondaryLabel}
                                </Link>
                            </div>

                            <div className='mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-(--border-line) pt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                <span className='inline-flex items-center gap-2'>
                                    <CheckCircle2
                                        size={13}
                                        className='text-forest dark:text-forest-dark'
                                        aria-hidden='true'
                                    />
                                    Every applicant gets a verdict
                                </span>
                                <span className='inline-flex items-center gap-2'>
                                    <BadgeCheck
                                        size={13}
                                        className='text-forest dark:text-forest-dark'
                                        aria-hidden='true'
                                    />
                                    Verified evidence
                                </span>
                                <span className='inline-flex items-center gap-2'>
                                    <Sparkles
                                        size={13}
                                        className='text-amber-accent'
                                        aria-hidden='true'
                                    />
                                    Built for 58 wilayas
                                </span>
                            </div>
                        </div>

                        <div className='lg:col-span-5'>
                            <div className='rounded-lg border border-(--border-line) bg-(--bg-panel) p-5 sm:p-6'>
                                <div className='flex items-center justify-between border-b border-(--border-line) pb-3'>
                                    <span className='font-mono text-[10px] uppercase tracking-[0.18em] text-(--text-sub)'>
                                        Evidence Routing
                                    </span>
                                    <span className='font-mono text-[10px] text-(--text-sub)'>
                                        01 / 03
                                    </span>
                                </div>

                                <ol className='mt-4 space-y-2.5'>
                                    {[
                                        {
                                            icon: FileText,
                                            title: 'Application received',
                                            detail: 'Parsed across FR / EN / AR',
                                        },
                                        {
                                            icon: BadgeCheck,
                                            title: 'Rubric audit',
                                            detail: '3 verified repos • 94% evidence match',
                                        },
                                        {
                                            icon: Route,
                                            title: 'Outcome routed',
                                            detail: 'Interview slot or concrete growth path',
                                        },
                                    ].map((step, index) => {
                                        const Icon = step.icon;

                                        return (
                                            <li
                                                key={step.title}
                                                className='flex items-start gap-3 rounded-md border border-(--border-line) bg-(--bg-canvas) p-3.5'>
                                                <span className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-(--border-line) bg-(--bg-panel) text-(--text-main)'>
                                                    <Icon
                                                        size={15}
                                                        aria-hidden='true'
                                                    />
                                                </span>
                                                <div className='min-w-0 flex-1'>
                                                    <div className='flex items-center justify-between gap-3'>
                                                        <p className='text-sm font-semibold text-(--text-main)'>
                                                            {step.title}
                                                        </p>
                                                        <span className='font-mono text-[9px] text-(--text-sub)'>
                                                            0{index + 1}
                                                        </span>
                                                    </div>
                                                    <p className='mt-0.5 text-[11px] leading-relaxed text-(--text-sub)'>
                                                        {step.detail}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>

                                <p className='mt-4 border-t border-(--border-line) pt-3 font-mono text-[10px] leading-relaxed text-(--text-sub)'>
                                    Verified evidence sends every application
                                    to an interview or a concrete growth path.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Applicants */}
                <section
                    id='applicants'
                    className='scroll-mt-8 border-t border-(--border-line) py-16 md:py-24'>
                    <SectionHeading
                        index='01'
                        label='Applicants'
                        title='Apply once. Grow every time.'
                        description='No more applications disappearing into a PDF black hole. Skillora turns every submission into a decision — and every decision into a next step.'
                    />

                    <div className='mt-10 grid gap-6 lg:grid-cols-12 lg:items-start'>
                        <div className='grid gap-4 sm:grid-cols-2 lg:col-span-7'>
                            {APPLICANT_FEATURES.map((feature) => (
                                <FeatureCard
                                    key={feature.title}
                                    feature={feature}
                                />
                            ))}
                        </div>

                        <div className='lg:col-span-5'>
                            <div className='overflow-hidden rounded-xl border border-(--border-line) bg-(--bg-panel)'>
                                <div className='flex items-start justify-between gap-3 border-b border-(--border-line) px-5 py-4'>
                                    <div>
                                        <p className='font-mono text-[10px] uppercase tracking-[0.18em] text-(--text-sub)'>
                                            Growth dossier
                                        </p>
                                        <p className='mt-1 font-grotesque text-2xl font-bold text-(--text-main)'>
                                            Application #DZ-308
                                        </p>
                                    </div>
                                    <span className='rounded-full border border-amber-accent/40 bg-amber-accent/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-amber-accent'>
                                        Actionable
                                    </span>
                                </div>

                                <div className='space-y-5 p-5'>
                                    <div>
                                        <div className='flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                            <span>Evidence match</span>
                                            <span>72%</span>
                                        </div>
                                        <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-(--border-line)'>
                                            <div className='h-full w-[72%] rounded-full bg-forest dark:bg-forest-dark' />
                                        </div>
                                    </div>

                                    <div className='rounded-lg border border-(--border-line) bg-(--bg-canvas) p-4'>
                                        <div className='flex items-start gap-2.5'>
                                            <Target
                                                size={15}
                                                className='mt-0.5 shrink-0 text-amber-accent'
                                                aria-hidden='true'
                                            />
                                            <div>
                                                <p className='text-xs font-semibold text-(--text-main)'>
                                                    One gap to close
                                                </p>
                                                <p className='mt-1 text-xs leading-relaxed text-(--text-sub)'>
                                                    Kubernetes orchestration.
                                                    Recommended path: deploy a
                                                    Helm microservice, then
                                                    re-apply.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className='flex items-center gap-2 text-xs text-(--text-main)'>
                                        <CheckCircle2
                                            size={15}
                                            className='shrink-0 text-forest dark:text-forest-dark'
                                            aria-hidden='true'
                                        />
                                        Interview or growth plan — never
                                        silence.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='mt-8 flex flex-wrap items-center gap-x-6 gap-y-3'>
                        <Link
                            to={applicantPrimary}
                            className={PRIMARY_BUTTON}>
                            {applicantPrimaryLabel}
                            <ArrowRight
                                size={16}
                                aria-hidden='true'
                            />
                        </Link>
                        <Link
                            to={applicantSecondary}
                            className={TEXT_LINK}>
                            {applicantSecondaryLabel}
                            <ArrowUpRight
                                size={13}
                                aria-hidden='true'
                            />
                        </Link>
                    </div>
                </section>

                {/* 3. Recruiters */}
                <section
                    id='recruiters'
                    className='scroll-mt-8 border-t border-(--border-line) py-16 md:py-24'>
                    <SectionHeading
                        index='02'
                        label='Recruiters'
                        title='Shortlists with proof attached.'
                        description='Stop screening on adjectives. Skillora routes candidates by verified evidence, keeps every role in one structured pipeline, and removes the scheduling drag.'
                    />

                    <div className='mt-10 grid gap-6 lg:grid-cols-12 lg:items-start'>
                        <div className='lg:col-span-5'>
                            <div className='rounded-xl border border-(--border-line) bg-(--bg-panel) p-5'>
                                <div className='flex items-start justify-between gap-3 border-b border-(--border-line) pb-4'>
                                    <div>
                                        <p className='font-mono text-[10px] uppercase tracking-[0.18em] text-(--text-sub)'>
                                            Live shortlist
                                        </p>
                                        <p className='mt-1 font-grotesque text-2xl font-bold text-(--text-main)'>
                                            Data Engineer
                                        </p>
                                    </div>
                                    <span className='inline-flex items-center gap-1.5 rounded-full border border-forest/30 bg-forest/8 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-forest dark:border-forest-dark/30 dark:bg-forest-dark/10 dark:text-forest-dark'>
                                        <span className='h-1.5 w-1.5 rounded-full bg-forest dark:bg-forest-dark' />
                                        Live
                                    </span>
                                </div>

                                <div className='mt-4 space-y-3'>
                                    {CANDIDATES.map((candidate) => (
                                        <div
                                            key={candidate.id}
                                            className='rounded-md border border-(--border-line) bg-(--bg-canvas) p-3.5'>
                                            <div className='flex items-center justify-between gap-3'>
                                                <span className='font-mono text-[11px] text-(--text-sub)'>
                                                    {candidate.id}
                                                </span>
                                                <span className='font-grotesque text-xl font-bold text-(--text-main)'>
                                                    {candidate.match}%
                                                </span>
                                            </div>
                                            <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-(--border-line)'>
                                                <div
                                                    className='h-full rounded-full bg-forest dark:bg-forest-dark'
                                                    style={{
                                                        width: `${candidate.match}%`,
                                                    }}
                                                />
                                            </div>
                                            <p className='mt-2 text-[11px] text-(--text-sub)'>
                                                {candidate.note}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <p className='mt-4 border-t border-(--border-line) pt-3 text-[11px] leading-relaxed text-(--text-sub)'>
                                    Every row is backed by verified artifacts,
                                    not self-reported skills.
                                </p>
                            </div>
                        </div>

                        <div className='grid gap-4 sm:grid-cols-2 lg:col-span-7'>
                            {RECRUITER_FEATURES.map((feature) => (
                                <FeatureCard
                                    key={feature.title}
                                    feature={feature}
                                />
                            ))}
                        </div>
                    </div>

                    <div className='mt-8 flex flex-wrap items-center gap-x-6 gap-y-3'>
                        <Link
                            to={recruiterPrimary}
                            className={PRIMARY_BUTTON}>
                            {recruiterPrimaryLabel}
                            <ArrowRight
                                size={16}
                                aria-hidden='true'
                            />
                        </Link>
                        <Link
                            to='/pricing'
                            className={TEXT_LINK}>
                            See hiring plans
                            <ArrowUpRight
                                size={13}
                                aria-hidden='true'
                            />
                        </Link>
                    </div>
                </section>

                {/* 4. Clients */}
                <section
                    id='clients'
                    className='scroll-mt-8 border-t border-(--border-line) py-16 md:py-24'>
                    <div className='flex flex-col gap-6 md:flex-row md:items-end md:justify-between'>
                        <SectionHeading
                            index='03'
                            label='Clients'
                            title='Built for the teams moving Algeria forward.'
                            description='From global audit firms to local industry leaders, search the companies operating across the country — and find where your next role might be.'
                        />

                        <div className='relative w-full md:max-w-md'>
                            <Search
                                size={16}
                                className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-sub)'
                                aria-hidden='true'
                            />
                            <input
                                type='text'
                                value={companyQuery}
                                onChange={(event) =>
                                    setCompanyQuery(event.target.value)
                                }
                                placeholder='Search company, sector, or city'
                                aria-label='Search companies by name, sector, or city'
                                maxLength={60}
                                className='w-full rounded-md border border-(--border-line) bg-(--bg-canvas) py-3 pl-10 pr-10 text-sm text-(--text-main) outline-none transition-colors placeholder:text-(--text-sub) focus:border-(--text-main)'
                            />
                            {companyQuery && (
                                <button
                                    type='button'
                                    onClick={() => setCompanyQuery('')}
                                    aria-label='Clear company search'
                                    className='absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-(--text-sub) transition-colors hover:bg-(--bg-panel) hover:text-(--text-main)'>
                                    <X
                                        size={14}
                                        aria-hidden='true'
                                    />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className='mt-4 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-(--text-sub)'>
                        <span>
                            {isSearching || showAllCompanies ?
                                <>
                                    {filteredCompanies.length} of{' '}
                                    {ALGERIAN_COMPANIES.length} companies
                                </>
                            :   <>
                                    Showing {visibleCompanies.length} of{' '}
                                    {ALGERIAN_COMPANIES.length} companies
                                </>
                            }
                        </span>
                        <span className='hidden sm:inline'>
                            Across 58 wilayas
                        </span>
                    </div>

                    {filteredCompanies.length > 0 ?
                        <>
                            <div className='mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                                {visibleCompanies.map((company) => (
                                    <article
                                        key={company.name}
                                        className='group flex items-center gap-3 rounded-lg border border-(--border-line) bg-(--bg-canvas) p-3.5 transition-colors hover:border-(--text-sub)/40 hover:bg-(--bg-panel)'>
                                        <span
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md font-grotesque text-lg font-bold ring-1 ${monogramTone(company.name)}`}
                                            aria-hidden='true'>
                                            {company.monogram}
                                        </span>
                                        <div className='min-w-0'>
                                            <h3
                                                className='truncate text-sm font-semibold text-(--text-main)'
                                                title={company.name}>
                                                {company.name}
                                            </h3>
                                            <p className='truncate font-mono text-[9px] uppercase leading-snug tracking-[0.1em] text-(--text-sub)'>
                                                {company.sector}
                                            </p>
                                            <p className='truncate font-mono text-[9px] uppercase leading-snug tracking-[0.1em] text-(--text-sub)'>
                                                {company.city}
                                            </p>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {!isSearching &&
                                filteredCompanies.length >
                                    COMPANY_PREVIEW_COUNT && (
                                    <div className='mt-5 flex justify-center'>
                                        <button
                                            type='button'
                                            onClick={() =>
                                                setShowAllCompanies(
                                                    (expanded) => !expanded
                                                )
                                            }
                                            aria-expanded={showAllCompanies}
                                            className='inline-flex items-center gap-2 rounded-md border border-(--border-line) px-4 py-2.5 text-xs font-semibold text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                            {showAllCompanies ?
                                                'Show fewer companies'
                                            :   `Show all ${filteredCompanies.length} companies`}
                                            <ChevronDown
                                                size={14}
                                                aria-hidden='true'
                                                className={`transition-transform ${showAllCompanies ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                    </div>
                                )}
                        </>
                    :   <div className='mt-6 rounded-lg border border-dashed border-(--border-line) px-6 py-14 text-center'>
                            <Search
                                size={32}
                                strokeWidth={1.25}
                                className='mx-auto text-(--text-sub)'
                                aria-hidden='true'
                            />
                            <p className='mt-3 break-words font-grotesque text-xl font-bold text-(--text-main)'>
                                No companies match “{companyQuery}”
                            </p>
                            <p className='mt-1 text-sm text-(--text-sub)'>
                                Try a company name, a sector like “Banking”,
                                or a city like “Bejaïa”.
                            </p>
                            <button
                                type='button'
                                onClick={() => setCompanyQuery('')}
                                className='mt-4 rounded-md border border-(--border-line) px-4 py-2 text-xs font-semibold text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                Clear search
                            </button>
                        </div>
                    }

                    <div className='mt-8 flex flex-col items-start justify-between gap-4 rounded-lg border border-(--border-line) bg-(--bg-panel) p-5 sm:flex-row sm:items-center'>
                        <div>
                            <p className='font-grotesque text-xl font-bold text-(--text-main)'>
                                Don’t see your company?
                            </p>
                            <p className='mt-1 text-sm text-(--text-sub)'>
                                Tell us who you are hiring for and we’ll add
                                your team to the directory.
                            </p>
                        </div>
                        <a
                            href='mailto:contact@skillora.dz?subject=Add%20our%20company%20to%20Skillora'
                            className={SECONDARY_BUTTON}>
                            <Building2
                                size={16}
                                aria-hidden='true'
                            />
                            Add your company
                        </a>
                    </div>
                </section>

                {/* 5. Contact */}
                <section
                    id='contact'
                    className='scroll-mt-8 border-t border-(--border-line) py-16 md:py-24'>
                    <div className='grid gap-10 lg:grid-cols-12 lg:items-start'>
                        <div className='lg:col-span-5'>
                            <SectionHeading
                                index='04'
                                label='Contact'
                                title='Tell us what you are looking for.'
                                description='Whether you are building a team, looking for your next role, or want your company in the directory, a real person reads every message.'
                            />

                            <div className='mt-8 space-y-3'>
                                {CONTACT_ITEMS.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            key={item.label}
                                            className='flex items-start gap-3 rounded-lg border border-(--border-line) bg-(--bg-canvas) p-4'>
                                            <span className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-(--border-line) bg-(--bg-panel) text-(--text-main)'>
                                                <Icon
                                                    size={15}
                                                    aria-hidden='true'
                                                />
                                            </span>
                                            <div>
                                                <p className='font-mono text-[9px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                                    {item.label}
                                                </p>
                                                {item.label === 'Email' ?
                                                    <a
                                                        href='mailto:contact@skillora.dz'
                                                        className='mt-1 block text-sm text-(--text-main) transition-colors hover:text-forest dark:hover:text-forest-dark'>
                                                        {item.value}
                                                    </a>
                                                :   <p className='mt-1 text-sm text-(--text-main)'>
                                                        {item.value}
                                                    </p>
                                                }
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                type='button'
                                onClick={handleCopyEmail}
                                className='mt-4 inline-flex items-center gap-2 rounded-md border border-(--border-line) px-4 py-2.5 text-xs font-semibold text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                {copied ?
                                    <Check
                                        size={14}
                                        aria-hidden='true'
                                    />
                                :   <Copy
                                        size={14}
                                        aria-hidden='true'
                                    />
                                }
                                {copied ? 'Email copied' : 'Copy email address'}
                            </button>
                        </div>

                        <div className='lg:col-span-7'>
                            <form
                                onSubmit={handleContactSubmit}
                                className='rounded-xl border border-(--border-line) bg-(--bg-panel) p-5 sm:p-6'>
                                <div className='grid gap-4 sm:grid-cols-2'>
                                    <label className='block'>
                                        <span className='mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                            Name
                                        </span>
                                        <input
                                            type='text'
                                            required
                                            value={contactName}
                                            onChange={(event) =>
                                                setContactName(
                                                    event.target.value
                                                )
                                            }
                                            autoComplete='name'
                                            placeholder='Your name'
                                            className={FIELD_CLASS}
                                        />
                                    </label>

                                    <label className='block'>
                                        <span className='mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                            Email
                                        </span>
                                        <input
                                            type='email'
                                            required
                                            value={contactEmail}
                                            onChange={(event) =>
                                                setContactEmail(
                                                    event.target.value
                                                )
                                            }
                                            autoComplete='email'
                                            placeholder='you@company.dz'
                                            className={FIELD_CLASS}
                                        />
                                    </label>
                                </div>

                                <label className='mt-4 block'>
                                    <span className='mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                        I am a
                                    </span>
                                    <select
                                        value={contactRole}
                                        onChange={(event) =>
                                            setContactRole(event.target.value)
                                        }
                                        className={FIELD_CLASS}>
                                        <option value='Recruiter'>
                                            Recruiter / hiring team
                                        </option>
                                        <option value='Applicant'>
                                            Applicant
                                        </option>
                                        <option value='Partner'>
                                            Partner / other
                                        </option>
                                    </select>
                                </label>

                                <label className='mt-4 block'>
                                    <span className='mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-(--text-sub)'>
                                        Message
                                    </span>
                                    <textarea
                                        required
                                        rows={5}
                                        value={contactMessage}
                                        onChange={(event) =>
                                            setContactMessage(
                                                event.target.value
                                            )
                                        }
                                        placeholder='Tell us about the role, the team, or the question on your mind.'
                                        className={`${FIELD_CLASS} resize-y`}
                                    />
                                </label>

                                <div className='mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                                    <button
                                        type='submit'
                                        className={PRIMARY_BUTTON}>
                                        <Send
                                            size={16}
                                            aria-hidden='true'
                                        />
                                        Send message
                                    </button>
                                    <p className='text-[11px] leading-relaxed text-(--text-sub)'>
                                        Opens your email app. Nothing is
                                        stored on this page.
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
