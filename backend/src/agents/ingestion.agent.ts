import { generateObject } from 'ai';
import { z } from 'zod';
import { logAgentExecution } from './agent-log.js';
import {
    compactDossier,
    type CandidateDossier,
} from './dossier.js';
import {
    describeError,
    getLlmModelUsed,
    getLlmRuntime,
} from './model.factory.js';

export const ArtifactMetricSchema = z.object({
    label: z.string(),
    value: z.string(),
});

export const IngestionOutputSchema = z.object({
    anonymousId: z.string(),
    domain: z.enum(['tech', 'legal', 'finance', 'operations', 'other']),
    yearsOfExperience: z.number().min(0),
    educationLevel: z.string(),
    extractedSkills: z.array(z.string()),
    verifiableArtifacts: z.array(
        z.object({
            type: z.enum([
                'repo',
                'case_brief',
                'bar_license',
                'certification',
                'portfolio',
                'degree',
                'experience',
            ]),
            title: z.string(),
            summary: z.string(),
            metrics: z.array(ArtifactMetricSchema),
        })
    ),
});

export type IngestionOutput = z.infer<typeof IngestionOutputSchema>;

const INGESTION_SYSTEM_PROMPT = `You are the Skillora Ingestion Agent: the privacy firewall and credential normalizer of an evidence-based recruitment pipeline.

Your responsibilities:
1. STRICT PII STRIPPING. Remove all personal identifiers from every output field: full or partial names, email addresses, phone numbers, postal addresses, social handles, personal URLs, and identity-bearing usernames. Never repeat them. Refer to the candidate only by the supplied anonymous reference.
2. ALGERIAN CREDENTIAL NORMALIZATION. Convert institutions and degrees to canonical names:
   - ESI -> "École Supérieure d'Informatique (ESI), Algiers"
   - USTHB -> "Université des Sciences et de la Technologie Houari Boumediene (USTHB)"
   - UMBB -> "Université M'Hamed Bougara de Boumerdès (UMBB)"
   - USTO -> "Université des Sciences et de la Technologie d'Oran Mohamed Boudiaf (USTO-MB)"
   - HEC Alger -> "École des Hautes Études Commerciales (HEC Alger)"
   - EHEC -> "École des Hautes Études Commerciales (EHEC)"
   - EPAU -> "École Polytechnique d'Architecture et d'Urbanisme (EPAU)"
   - Université d'Alger 3 -> "Université d'Alger 3"
   - CAPA -> "Certificat d'Aptitude à la Profession d'Avocat (CAPA)"
   - Ingénieur d'État -> "Ingénieur d'État"
   - Licence -> "Licence (Bac+3)"
   - Master -> "Master (Bac+5)"
   - Doctorat -> "Doctorat"
3. EVIDENCE ONLY. Extract only what the dossier explicitly supports. Never invent skills, employers, dates, artifacts, metrics, or years of experience. If a fact is absent, omit it or use 0 for yearsOfExperience.
4. DOMAIN. Classify the candidate as tech, legal, finance, operations, or other from the headline, experience, projects, and skills.
5. VERIFIABLE ARTIFACTS. Include every dated role as an "experience" artifact (title "Role — Company", summary of its highlights, metrics for dates and location), every project (use type "repo" when project.source is "repository", otherwise "portfolio"), every certification, every degree, and every portfolio link. URLs are pre-redacted: keep the artifact even when its URL is "[redacted-url]", and never emit a URL in any output field. Use metrics as an array of factual label/value string pairs (for example {"label":"issuer","value":"AWS"}).
6. SKILLS. extractedSkills must include every skill explicitly listed in dossier.skills and every technology named in project tags. Normalize duplicates and keep canonical casing.
7. YEARS OF EXPERIENCE. Derive from dated roles. Do not guess when dates are missing.
8. Keep strings concise and factual. The response must match the provided schema exactly.`;

function buildIngestionPrompt(
    dossier: CandidateDossier,
    anonymousId: string
): string {
    return `Anonymous candidate reference: ${anonymousId}

The following dossier may contain PII. Strip it before producing any output field.

<dossier>
${JSON.stringify(compactDossier(dossier), null, 2)}
</dossier>

Produce the anonymized ingestion telemetry for this candidate.`;
}

function parseYear(value: string | null | undefined): number | null {
    if (!value) return null;
    const match = value.match(/(?:19|20)\d{2}/);
    return match ? Number(match[0]) : null;
}

function estimateYearsOfExperience(dossier: CandidateDossier): number {
    const starts = dossier.experience
        .map((item) => parseYear(item.startDate))
        .filter((year): year is number => year !== null);
    const ends = dossier.experience
        .map((item) => parseYear(item.endDate))
        .filter((year): year is number => year !== null);

    if (starts.length === 0) return 0;

    const start = Math.min(...starts);
    const end = ends.length > 0 ? Math.max(...ends) : new Date().getFullYear();

    return Math.max(0, end - start);
}

function inferDomain(dossier: CandidateDossier): IngestionOutput['domain'] {
    const haystack = [
        dossier.headline,
        dossier.summary ?? '',
        ...dossier.skills,
        ...dossier.projects.flatMap((project) => project.tags),
    ]
        .join(' ')
        .toLowerCase();

    if (
        /(engineer|developer|software|data|cloud|devops|cyber|network|frontend|backend|full.?stack|machine learning|artificial intelligence|\bml\b|\bai\b)/.test(
            haystack
        )
    ) {
        return 'tech';
    }
    if (/(law|legal|juriste|avocat|counsel|compliance|notaire|paralegal)/.test(haystack)) {
        return 'legal';
    }
    if (/(finance|financial|accounting|comptable|audit|bank|treasury|risk)/.test(haystack)) {
        return 'finance';
    }
    if (/(operations|supply|logistics|procurement|project manager|\bhr\b|human resources)/.test(haystack)) {
        return 'operations';
    }
    return 'other';
}

function compactMetrics(
    metrics: Record<string, string | number | boolean | null | undefined>
): Array<{ label: string; value: string }> {
    return Object.entries(metrics)
        .filter(
            ([, value]) =>
                value !== null && value !== undefined && value !== ''
        )
        .map(([label, value]) => ({ label, value: String(value) }));
}

function buildHeuristicTelemetry(
    dossier: CandidateDossier,
    anonymousId: string
): IngestionOutput {
    const artifacts: IngestionOutput['verifiableArtifacts'] = [];

    for (const education of dossier.education.slice(0, 6)) {
        artifacts.push({
            type: 'degree',
            title: `${education.degree} — ${education.institution}`,
            summary: `${education.field}${education.startDate ? ` (${education.startDate}${education.endDate ? ` – ${education.endDate}` : ''})` : ''}`,
            metrics: compactMetrics({
                institution: education.institution,
                field: education.field,
                startDate: education.startDate,
                endDate: education.endDate,
            }),
        });
    }

    for (const project of dossier.projects.slice(0, 10)) {
        const isRepo =
            Boolean(project.projectUrl) &&
            /(github\.com|gitlab\.com|bitbucket\.org)/i.test(
                project.projectUrl ?? ''
            );

        artifacts.push({
            type: isRepo ? 'repo' : 'portfolio',
            title: project.title,
            summary: project.description || 'Project from candidate dossier',
            metrics: compactMetrics({
                tags: project.tags.join(', '),
                date: project.date,
            }),
        });
    }

    for (const certification of dossier.certifications.slice(0, 12)) {
        artifacts.push({
            type: 'certification',
            title: `${certification.name} — ${certification.issuer}`,
            summary: `Certification issued by ${certification.issuer}`,
            metrics: compactMetrics({
                issuer: certification.issuer,
                issueDate: certification.issueDate,
                credentialId: certification.credentialId,
            }),
        });
    }

    for (const link of dossier.links.slice(0, 8)) {
        artifacts.push({
            type: 'portfolio',
            title: link.label,
            summary: `Verified ${link.type} profile`,
            metrics: compactMetrics({ linkType: link.type }),
        });
    }

    const skills = Array.from(
        new Map(
            [
                ...dossier.skills,
                ...dossier.projects.flatMap((project) => project.tags),
            ]
                .map((skill) => skill.trim())
                .filter(Boolean)
                .map((skill) => [skill.toLowerCase(), skill])
        ).values()
    ).slice(0, 60);

    return {
        anonymousId,
        domain: inferDomain(dossier),
        yearsOfExperience: estimateYearsOfExperience(dossier),
        educationLevel:
            dossier.education[0]?.degree ||
            'Diplôme Supérieur (Non spécifié)',
        extractedSkills: skills,
        verifiableArtifacts: artifacts.slice(0, 20),
    };
}

export class IngestionAgent {
    async run(
        applicationId: string,
        dossier: CandidateDossier,
        anonymousId: string
    ): Promise<IngestionOutput> {
        const runtime = getLlmRuntime();

        if (runtime) {
            try {
                const { object, usage } = await generateObject({
                    model: runtime.model,
                    schema: IngestionOutputSchema,
                    schemaName: 'IngestionOutput',
                    schemaDescription:
                        'Anonymized candidate telemetry extracted from a resume dossier.',
                    system: INGESTION_SYSTEM_PROMPT,
                    prompt: buildIngestionPrompt(dossier, anonymousId),
                    temperature: runtime.temperature,
                    maxRetries: runtime.maxRetries,
                    maxOutputTokens: 2000,
                });

                const output: IngestionOutput = {
                    ...object,
                    anonymousId,
                };

                await logAgentExecution({
                    applicationId,
                    agentType: 'ingestion',
                    modelUsed: getLlmModelUsed(runtime),
                    usage,
                    rawInput: {
                        anonymousId,
                        headline: dossier.headline,
                        skillCount: dossier.skills.length,
                        experienceCount: dossier.experience.length,
                        projectCount: dossier.projects.length,
                        certificationCount: dossier.certifications.length,
                    },
                    structuredOutput: output,
                });

                return output;
            } catch (error) {
                console.warn(
                    `[agents:ingestion] LLM call failed (${describeError(
                        error
                    )}); using heuristic fallback.`
                );
            }
        }

        const output = buildHeuristicTelemetry(dossier, anonymousId);

        await logAgentExecution({
            applicationId,
            agentType: 'ingestion',
            modelUsed: 'heuristic-normalizer-v2',
            rawInput: {
                anonymousId,
                headline: dossier.headline,
                skillCount: dossier.skills.length,
                experienceCount: dossier.experience.length,
                projectCount: dossier.projects.length,
                certificationCount: dossier.certifications.length,
            },
            structuredOutput: output,
        });

        return output;
    }
}

export const ingestionAgent = new IngestionAgent();
