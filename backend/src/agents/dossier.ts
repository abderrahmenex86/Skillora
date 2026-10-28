import { prisma } from '../db/prisma.js';

/**
 * The expanded, resume-scoped view of a candidate that agents are allowed to
 * reason over. It deliberately excludes the User record so names, emails and
 * phone numbers never enter the evaluation pipeline.
 */
export interface CandidateDossier {
    headline: string;
    summary: string | null;
    skills: string[];
    education: Array<{
        degree: string;
        institution: string;
        field: string;
        startDate: string | null;
        endDate: string | null;
    }>;
    experience: Array<{
        company: string;
        role: string;
        location: string | null;
        startDate: string;
        endDate: string | null;
        highlights: string[];
    }>;
    projects: Array<{
        title: string;
        projectUrl: string | null;
        source: 'repository' | 'portfolio' | 'other';
        description: string | null;
        date: string | null;
        tags: string[];
    }>;
    certifications: Array<{
        name: string;
        issuer: string;
        issueDate: string | null;
        credentialId: string | null;
    }>;
    volunteering: Array<{
        organization: string;
        role: string;
        description: string | null;
        startDate: string | null;
        endDate: string | null;
    }>;
    languages: Array<{ name: string; proficiency: string }>;
    links: Array<{ label: string; url: string; type: string }>;
}

export interface DossierProfileSource {
    userId: string;
    title: string;
    summary: string | null;
    skills: string[];
    selectedEducationIds: string[];
    selectedExperienceIds: string[];
    selectedProjectIds: string[];
    selectedProjectAngles?: unknown;
    selectedCertificationIds: string[];
    selectedVolunteeringIds: string[];
    selectedLanguageIds: string[];
    selectedLinkIds: string[];
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

function orderById<T extends { id: string }>(items: T[], ids: string[]): T[] {
    const byId = new Map(items.map((item) => [item.id, item]));
    return ids
        .map((id) => byId.get(id))
        .filter((item): item is T => Boolean(item));
}

function classifyProjectSource(
    url: string | null
): 'repository' | 'portfolio' | 'other' {
    if (!url) return 'other';
    if (/(github\.com|gitlab\.com|bitbucket\.org)/i.test(url)) {
        return 'repository';
    }
    return 'portfolio';
}

export async function buildCandidateDossier(
    profile: DossierProfileSource
): Promise<CandidateDossier> {
    const projectIds =
        profile.selectedProjectIds.length > 0 ?
            profile.selectedProjectIds
        :   extractLegacyProjectIds(profile.selectedProjectAngles);

    const [
        educationRows,
        experienceRows,
        projectRows,
        certificationRows,
        volunteeringRows,
        languageRows,
        linkRows,
    ] = await Promise.all([
        prisma.vaultEducation.findMany({
            where: {
                userId: profile.userId,
                id: { in: profile.selectedEducationIds },
            },
        }),
        prisma.vaultExperience.findMany({
            where: {
                userId: profile.userId,
                id: { in: profile.selectedExperienceIds },
            },
        }),
        prisma.vaultProject.findMany({
            where: {
                userId: profile.userId,
                id: { in: projectIds },
            },
        }),
        prisma.vaultCertification.findMany({
            where: {
                userId: profile.userId,
                id: { in: profile.selectedCertificationIds },
            },
        }),
        prisma.vaultVolunteering.findMany({
            where: {
                userId: profile.userId,
                id: { in: profile.selectedVolunteeringIds },
            },
        }),
        prisma.vaultLanguage.findMany({
            where: {
                userId: profile.userId,
                id: { in: profile.selectedLanguageIds },
            },
        }),
        prisma.vaultLink.findMany({
            where: {
                userId: profile.userId,
                id: { in: profile.selectedLinkIds },
            },
        }),
    ]);

    return {
        headline: profile.title,
        summary: profile.summary,
        skills: profile.skills,
        education: orderById(educationRows, profile.selectedEducationIds).map(
            (item) => ({
                degree: item.degree,
                institution: item.institution,
                field: item.field,
                startDate: item.startDate,
                endDate: item.endDate,
            })
        ),
        experience: orderById(
            experienceRows,
            profile.selectedExperienceIds
        ).map((item) => ({
            company: item.company,
            role: item.role,
            location: item.location,
            startDate: item.startDate,
            endDate: item.endDate,
            highlights: item.highlights,
        })),
        projects: orderById(projectRows, projectIds).map((item) => ({
            title: item.title,
            projectUrl: item.projectUrl,
            source: classifyProjectSource(item.projectUrl),
            description: item.description,
            date: item.date,
            tags: item.tags,
        })),
        certifications: orderById(
            certificationRows,
            profile.selectedCertificationIds
        ).map((item) => ({
            name: item.name,
            issuer: item.issuer,
            issueDate: item.issueDate,
            credentialId: item.credentialId,
        })),
        volunteering: orderById(
            volunteeringRows,
            profile.selectedVolunteeringIds
        ).map((item) => ({
            organization: item.organization,
            role: item.role,
            description: item.description,
            startDate: item.startDate,
            endDate: item.endDate,
        })),
        languages: orderById(languageRows, profile.selectedLanguageIds).map(
            (item) => ({
                name: item.name,
                proficiency: item.proficiency,
            })
        ),
        links: orderById(linkRows, profile.selectedLinkIds).map((item) => ({
            label: item.label,
            url: item.url,
            type: item.type,
        })),
    };
}

function clip(value: string | null, max: number): string | null {
    if (!value) return null;
    return value.length > max ? `${value.slice(0, max)}…` : value;
}

function redactText(value: string | null, max: number): string | null {
    if (!value) return null;
    const redacted = value.replace(/https?:\/\/[^\s)]+/g, '[redacted-url]');
    return clip(redacted, max);
}

/**
 * Keeps prompts inside the context window of smaller local models without
 * changing the evidence that matters most. URLs are removed entirely so that
 * personal handles and hostnames never reach the model.
 */
export function compactDossier(dossier: CandidateDossier): CandidateDossier {
    return {
        headline: redactText(dossier.headline, 200) ?? '',
        summary: redactText(dossier.summary, 1500),
        skills: dossier.skills
            .slice(0, 40)
            .map((skill) => redactText(skill, 80) ?? ''),
        education: dossier.education.slice(0, 6).map((item) => ({
            ...item,
            degree: clip(item.degree, 200) ?? '',
            institution: clip(item.institution, 200) ?? '',
            field: clip(item.field, 200) ?? '',
        })),
        experience: dossier.experience.slice(0, 8).map((item) => ({
            ...item,
            highlights: item.highlights
                .slice(0, 6)
                .map((highlight) => redactText(highlight, 300) ?? ''),
        })),
        projects: dossier.projects.slice(0, 10).map((item) => ({
            ...item,
            projectUrl: null,
            description: redactText(item.description, 600),
            tags: item.tags.slice(0, 12),
        })),
        certifications: dossier.certifications.slice(0, 12).map((item) => ({
            ...item,
            name: clip(item.name, 200) ?? '',
            issuer: clip(item.issuer, 200) ?? '',
        })),
        volunteering: dossier.volunteering.slice(0, 6).map((item) => ({
            ...item,
            description: redactText(item.description, 600),
        })),
        languages: dossier.languages.slice(0, 8),
        links: dossier.links.slice(0, 8).map((item) => ({
            ...item,
            label: clip(item.label, 120) ?? '',
            url: '[redacted-url]',
        })),
    };
}
