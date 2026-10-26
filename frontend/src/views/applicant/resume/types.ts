export type InfoKind =
    | 'education'
    | 'experience'
    | 'project'
    | 'certification'
    | 'volunteering'
    | 'language'
    | 'link';

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

export type VaultItem =
    | VaultEducation
    | VaultExperience
    | VaultProject
    | VaultCertification
    | VaultVolunteering
    | VaultLanguage
    | VaultLink;

export interface VaultLibrary {
    education: VaultEducation[];
    experience: VaultExperience[];
    projects: VaultProject[];
    certifications: VaultCertification[];
    volunteering: VaultVolunteering[];
    languages: VaultLanguage[];
    links: VaultLink[];
}

export type SelectionField =
    | 'selectedEducationIds'
    | 'selectedExperienceIds'
    | 'selectedProjectIds'
    | 'selectedCertificationIds'
    | 'selectedVolunteeringIds'
    | 'selectedLanguageIds'
    | 'selectedLinkIds';

export type ResumeSelections = Record<InfoKind, string[]>;

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
    kind: InfoKind;
    id: string;
}

export interface InfoDisplay {
    title: string;
    subtitle?: string;
    description?: string;
    tags?: string[];
    url?: string;
}

export const INFO_KINDS: InfoKind[] = [
    'education',
    'experience',
    'project',
    'certification',
    'volunteering',
    'language',
    'link',
];

export const INFO_LABELS: Record<InfoKind, string> = {
    education: 'Education',
    experience: 'Experience',
    project: 'Projects',
    certification: 'Certifications',
    volunteering: 'Volunteering',
    language: 'Languages',
    link: 'Links & Portfolios',
};

export const INFO_SINGULAR_LABELS: Record<InfoKind, string> = {
    education: 'Diploma',
    experience: 'Experience',
    project: 'Project',
    certification: 'Certification',
    volunteering: 'Volunteering',
    language: 'Language',
    link: 'Link',
};

export const INFO_ENDPOINTS: Record<InfoKind, string> = {
    education: 'education',
    experience: 'experience',
    project: 'projects',
    certification: 'certifications',
    volunteering: 'volunteering',
    language: 'languages',
    link: 'links',
};

export const SELECTION_FIELDS: Record<InfoKind, SelectionField> = {
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
    }
}

export function getLibraryItem(
    library: VaultLibrary,
    kind: InfoKind,
    id: string
): VaultItem | undefined {
    return getLibraryItems(library, kind).find((item) => item.id === id);
}

function formatRange(
    startDate?: string | null,
    endDate?: string | null
): string {
    return [startDate, endDate].filter(Boolean).join(' - ');
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
                subtitle: project.date || '',
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
                    certification.issueDate,
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
    return INFO_KINDS.reduce(
        (count, kind) => count + draft.selections[kind].length,
        0
    );
}
