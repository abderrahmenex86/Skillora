export type ResumeInfoKind =
    | 'education'
    | 'experience'
    | 'project'
    | 'certification'
    | 'volunteering'
    | 'language'
    | 'link';

export type VaultEntryKind =
    | 'skill'
    | 'conference'
    | 'creative'
    | 'driving'
    | 'hobby'
    | 'honour'
    | 'network'
    | 'publication'
    | 'recommendation'
    | 'social'
    | 'other';

export type InfoKind = ResumeInfoKind | VaultEntryKind;

export interface VaultEducation {
    id: string;
    degree: string;
    institution: string;
    field: string;
    startDate?: string | null;
    endDate?: string | null;
}

export interface VaultExperience {
    id: string;
    company: string;
    role: string;
    location?: string | null;
    startDate: string;
    endDate?: string | null;
    highlights: string[];
}

export interface VaultProject {
    id: string;
    title: string;
    projectUrl?: string | null;
    description?: string | null;
    date?: string | null;
    tags: string[];
    narratives?: { label: string; text: string }[] | null;
}

export interface VaultCertification {
    id: string;
    name: string;
    issuer: string;
    issueDate?: string | null;
    credentialId?: string | null;
}

export interface VaultVolunteering {
    id: string;
    organization: string;
    role: string;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
}

export interface VaultLanguage {
    id: string;
    name: string;
    proficiency: string;
}

export interface VaultLink {
    id: string;
    label: string;
    url: string;
    type: string;
}

export interface VaultEntry {
    id: string;
    section: VaultEntryKind;
    title: string;
    subtitle?: string | null;
    description?: string | null;
    date?: string | null;
    endDate?: string | null;
    url?: string | null;
    tags: string[];
    createdAt?: string;
}

export type VaultItem =
    | VaultEducation
    | VaultExperience
    | VaultProject
    | VaultCertification
    | VaultVolunteering
    | VaultLanguage
    | VaultLink
    | VaultEntry;

export interface VaultLibrary {
    education: VaultEducation[];
    experience: VaultExperience[];
    projects: VaultProject[];
    certifications: VaultCertification[];
    volunteering: VaultVolunteering[];
    languages: VaultLanguage[];
    links: VaultLink[];
    entries: VaultEntry[];
}

export type SelectionField =
    | 'selectedEducationIds'
    | 'selectedExperienceIds'
    | 'selectedProjectIds'
    | 'selectedCertificationIds'
    | 'selectedVolunteeringIds'
    | 'selectedLanguageIds'
    | 'selectedLinkIds';

export type ResumeSelections = Record<ResumeInfoKind, string[]>;

export interface TailoredResume {
    id: string;
    title: string;
    resumeUrl?: string | null;
    summary?: string | null;
    skills: string[];
    selectedEducationIds: string[];
    selectedExperienceIds: string[];
    selectedProjectIds: string[];
    selectedProjectAngles?: unknown;
    selectedCertificationIds: string[];
    selectedVolunteeringIds: string[];
    selectedLanguageIds: string[];
    selectedLinkIds: string[];
    createdAt: string;
    updatedAt: string;
    _count?: {
        applications: number;
    };
}

export interface ResumeDraft {
    title: string;
    summary: string;
    skills: string[];
    selections: ResumeSelections;
}

export interface DragItem {
    source: 'library' | 'resume';
    kind: ResumeInfoKind;
    id: string;
}

export interface InfoDisplay {
    title: string;
    subtitle?: string;
    description?: string;
    tags?: string[];
    url?: string;
}

export const RESUME_INFO_KINDS: ResumeInfoKind[] = [
    'education',
    'experience',
    'project',
    'certification',
    'volunteering',
    'language',
    'link',
];

export const VAULT_ENTRY_KINDS: VaultEntryKind[] = [
    'skill',
    'conference',
    'creative',
    'driving',
    'hobby',
    'honour',
    'network',
    'publication',
    'recommendation',
    'social',
    'other',
];

export const INFO_KINDS: InfoKind[] = [
    'education',
    'experience',
    'skill',
    'language',
    'certification',
    'conference',
    'creative',
    'driving',
    'hobby',
    'honour',
    'network',
    'project',
    'publication',
    'recommendation',
    'social',
    'volunteering',
    'other',
    'link',
];

export function isVaultEntryKind(kind: InfoKind): kind is VaultEntryKind {
    return VAULT_ENTRY_KINDS.includes(kind as VaultEntryKind);
}

export const INFO_LABELS: Record<InfoKind, string> = {
    education: 'Education and training',
    experience: 'Work experience',
    skill: 'Skills',
    language: 'Language skills',
    certification: 'Certifications',
    conference: 'Conferences and seminars',
    creative: 'Creative works',
    driving: 'Driving Licence',
    hobby: 'Hobbies and interests',
    honour: 'Honours and awards',
    network: 'Networks and memberships',
    project: 'Projects',
    publication: 'Publications',
    recommendation: 'Recommendations',
    social: 'Social and political activities',
    volunteering: 'Volunteering',
    other: 'Other (Custom section)',
    link: 'Links & Portfolios',
};

export const INFO_SINGULAR_LABELS: Record<InfoKind, string> = {
    education: 'Diploma',
    experience: 'Experience',
    skill: 'Skill',
    language: 'Language',
    certification: 'Certification',
    conference: 'Conference',
    creative: 'Creative work',
    driving: 'Driving licence',
    hobby: 'Hobby',
    honour: 'Honour or award',
    network: 'Network or membership',
    project: 'Project',
    publication: 'Publication',
    recommendation: 'Recommendation',
    social: 'Activity',
    volunteering: 'Volunteering',
    other: 'Custom entry',
    link: 'Link',
};

export const INFO_ENDPOINTS: Record<InfoKind, string> = {
    education: 'education',
    experience: 'experience',
    skill: 'entries',
    language: 'languages',
    certification: 'certifications',
    conference: 'entries',
    creative: 'entries',
    driving: 'entries',
    hobby: 'entries',
    honour: 'entries',
    network: 'entries',
    project: 'projects',
    publication: 'entries',
    recommendation: 'entries',
    social: 'entries',
    volunteering: 'volunteering',
    other: 'entries',
    link: 'links',
};

export const SELECTION_FIELDS: Record<ResumeInfoKind, SelectionField> = {
    education: 'selectedEducationIds',
    experience: 'selectedExperienceIds',
    project: 'selectedProjectIds',
    certification: 'selectedCertificationIds',
    volunteering: 'selectedVolunteeringIds',
    language: 'selectedLanguageIds',
    link: 'selectedLinkIds',
};

export const emptyLibrary = (): VaultLibrary => ({
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    volunteering: [],
    languages: [],
    links: [],
    entries: [],
});

export const emptySelections = (): ResumeSelections => ({
    education: [],
    experience: [],
    project: [],
    certification: [],
    volunteering: [],
    language: [],
    link: [],
});

export const emptyDraft = (): ResumeDraft => ({
    title: '',
    summary: '',
    skills: [],
    selections: emptySelections(),
});

export function getLibraryItems(
    library: VaultLibrary,
    kind: InfoKind
): VaultItem[] {
    switch (kind) {
        case 'education':
            return library.education;
        case 'experience':
            return library.experience;
        case 'project':
            return library.projects;
        case 'certification':
            return library.certifications;
        case 'volunteering':
            return library.volunteering;
        case 'language':
            return library.languages;
        case 'link':
            return library.links;
        default:
            return (library.entries ?? []).filter(
                (entry) => entry.section === kind
            );
    }
}

export function getLibraryItem(
    library: VaultLibrary,
    kind: InfoKind,
    id: string
): VaultItem | undefined {
    return getLibraryItems(library, kind).find((item) => item.id === id);
}

function formatDate(value?: string | null): string {
    if (!value) return '';
    if (value === 'Present') return value;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return value;

    const date = new Date(
        Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    );
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date);
}

function formatRange(
    startDate?: string | null,
    endDate?: string | null
): string {
    return [formatDate(startDate), formatDate(endDate)]
        .filter(Boolean)
        .join(' - ');
}

export function describeInfo(
    kind: InfoKind,
    item: VaultItem
): InfoDisplay {
    switch (kind) {
        case 'education': {
            const education = item as VaultEducation;
            return {
                title: education.degree,
                subtitle: education.institution,
                description: [education.field, formatRange(education.startDate, education.endDate)]
                    .filter(Boolean)
                    .join(' · '),
            };
        }
        case 'experience': {
            const experience = item as VaultExperience;
            return {
                title: experience.role,
                subtitle: [experience.company, experience.location]
                    .filter(Boolean)
                    .join(' · '),
                description: [
                    formatRange(experience.startDate, experience.endDate),
                    ...(experience.highlights || []),
                ]
                    .filter(Boolean)
                    .join(' · '),
            };
        }
        case 'project': {
            const project = item as VaultProject;
            return {
                title: project.title,
                subtitle: formatDate(project.date),
                description:
                    project.description ||
                    project.narratives?.[0]?.text ||
                    '',
                tags: project.tags,
                url: project.projectUrl || undefined,
            };
        }
        case 'certification': {
            const certification = item as VaultCertification;
            return {
                title: certification.name,
                subtitle: certification.issuer,
                description: [
                    formatDate(certification.issueDate),
                    certification.credentialId,
                ]
                    .filter(Boolean)
                    .join(' · '),
            };
        }
        case 'volunteering': {
            const volunteering = item as VaultVolunteering;
            return {
                title: volunteering.role,
                subtitle: volunteering.organization,
                description: [
                    volunteering.description,
                    formatRange(
                        volunteering.startDate,
                        volunteering.endDate
                    ),
                ]
                    .filter(Boolean)
                    .join(' · '),
            };
        }
        case 'language': {
            const language = item as VaultLanguage;
            return {
                title: language.name,
                subtitle: language.proficiency,
            };
        }
        case 'link': {
            const link = item as VaultLink;
            return {
                title: link.label,
                subtitle:
                    link.type.charAt(0).toUpperCase() + link.type.slice(1),
                url: link.url,
            };
        }
        default: {
            const entry = item as VaultEntry;
            const range = formatRange(entry.date, entry.endDate);
            return {
                title: entry.title,
                subtitle: entry.subtitle || undefined,
                description:
                    [entry.description, range]
                        .filter(Boolean)
                        .join(' · ') || undefined,
                tags: entry.tags,
                url: entry.url || undefined,
            };
        }
    }
}

function extractLegacyProjectIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((entry) => {
        if (typeof entry === 'string') return [entry];
        if (
            entry &&
            typeof entry === 'object' &&
            'projectId' in entry &&
            typeof entry.projectId === 'string'
        ) {
            return [entry.projectId];
        }
        return [];
    });
}

export function resumeToDraft(profile: TailoredResume): ResumeDraft {
    const selectedProjectIds =
        profile.selectedProjectIds?.length ?
            profile.selectedProjectIds
        :   extractLegacyProjectIds(profile.selectedProjectAngles);

    return {
        title: profile.title,
        summary: profile.summary || '',
        skills: profile.skills || [],
        selections: {
            education: profile.selectedEducationIds || [],
            experience: profile.selectedExperienceIds || [],
            project: selectedProjectIds,
            certification: profile.selectedCertificationIds || [],
            volunteering: profile.selectedVolunteeringIds || [],
            language: profile.selectedLanguageIds || [],
            link: profile.selectedLinkIds || [],
        },
    };
}

export function draftToPayload(draft: ResumeDraft) {
    return {
        title: draft.title.trim(),
        summary: draft.summary.trim() || undefined,
        skills: draft.skills,
        selectedEducationIds: draft.selections.education,
        selectedExperienceIds: draft.selections.experience,
        selectedProjectIds: draft.selections.project,
        selectedCertificationIds: draft.selections.certification,
        selectedVolunteeringIds: draft.selections.volunteering,
        selectedLanguageIds: draft.selections.language,
        selectedLinkIds: draft.selections.link,
    };
}

export function countSelectedItems(draft: ResumeDraft): number {
    return RESUME_INFO_KINDS.reduce(
        (count, kind) => count + draft.selections[kind].length,
        0
    );
}
