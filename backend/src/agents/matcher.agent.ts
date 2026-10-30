import { generateObject } from 'ai';
import { z } from 'zod';
import { logAgentExecution } from './agent-log.js';
import {
    compactDossier,
    type CandidateDossier,
} from './dossier.js';
import { IngestionOutput } from './ingestion.agent.js';
import {
    describeError,
    getLlmModelUsed,
    getLlmRuntime,
} from './model.factory.js';

export const MatcherOutputSchema = z.object({
    matchScore: z.number().min(0).max(100),
    rubricScore: z.number().min(0).max(100),
    category: z.enum(['ELIGIBLE', 'NEEDS_REVIEW', 'REDIRECTED']),
    mandatoryCriteriaAudit: z.array(
        z.object({
            criterion: z.string(),
            satisfied: z.boolean(),
            evidenceFound: z.string().nullable(),
        })
    ),
    descriptionAudit: z.object({
        score: z.number().min(0).max(100),
        strengths: z.array(z.string()),
        gaps: z.array(z.string()),
        rationale: z.string(),
    }),
    experienceAudit: z.object({
        targetYears: z.number().nullable(),
        provenYears: z.number().nullable(),
        score: z.number().min(0).max(100),
        rationale: z.string(),
    }),
    strengths: z.array(z.string()),
    unmetRequirements: z.array(z.string()),
});

export type MatcherOutput = z.infer<typeof MatcherOutputSchema>;

export interface Rubric {
    mandatoryCriteria: string[];
    preferredCriteria?: string[];
    minimumScoreThreshold?: number;
}

export interface MatcherContext {
    rubric: Rubric;
    description?: string | null;
    minimumYearsExperience?: number | null;
}

const LEGACY_DESCRIPTION_PLACEHOLDER =
    'Requirements are defined by the mandatory rubric for this role.';

function usableDescription(
    description: string | null | undefined
): string | null {
    const trimmed = description?.trim() ?? '';
    if (!trimmed || trimmed === LEGACY_DESCRIPTION_PLACEHOLDER) {
        return null;
    }
    return trimmed;
}

const MATCHER_SYSTEM_PROMPT = `You are the Skillora Matcher Agent. You evaluate an anonymized candidate dossier against a recruiter's rubric and job description using evidence, not keyword matching.

Evaluation rules:
1. Audit every mandatory criterion individually. A criterion is satisfied only when the dossier contains concrete evidence: a project, repository, certification, degree, dated role, quantified outcome, or an explicitly listed skill used in an artifact.
2. Do not infer evidence from a job title alone. Distinguish "claims a skill" from "demonstrated the skill in a verifiable artifact".
3. For each criterion, put a short factual evidence summary in evidenceFound. Use null when there is no evidence. Never fabricate evidence.
4. Preferred criteria may increase the rubricScore but can never compensate for an unmet mandatory criterion.
5. rubricScore is 0 to 100:
   - Up to 80 points for the proportion of mandatory criteria satisfied.
   - Up to 20 points for the proportion of preferred criteria satisfied.
6. descriptionAudit.score is 0 to 100 and measures how well the candidate's verified portfolio evidence matches the job description. Cite concrete strengths and gaps. If no description is provided, return a neutral score of 70.
7. experienceAudit is a soft signal. targetYears is the position's preferred proven years (or null). provenYears is what the dossier can actually verify. score is 0 to 100. If years cannot be verified, use a neutral score of 60 and say "years not verifiable". Never reject or redirect a candidate solely because their years are below target.
8. matchScore is the weighted combination of rubricScore, descriptionAudit.score, and experienceAudit.score. Use 70% rubric, 20% description, and 10% experience when a years target is set. Use 70% rubric and 30% description when it is not.
9. Category:
   - ELIGIBLE only when every mandatory criterion is satisfied and matchScore >= the minimumScoreThreshold (default 70).
   - NEEDS_REVIEW when at most one mandatory criterion is unmet, or when all mandatory criteria are satisfied but the combined score is below the threshold.
   - REDIRECTED when two or more mandatory criteria are unmet, or when a single unmet mandatory criterion also produces a combined score below 60. Years alone never cause REDIRECTED.
10. unmetRequirements must contain only mandatory criteria that are not satisfied.
11. Be strict, objective, and consistent. Never reward keyword stuffing or unverifiable claims.
12. The redacted dossier is supporting evidence. URLs have been removed for privacy; never treat a missing URL as missing evidence.
13. The response must match the provided schema exactly.`;

function buildMatcherPrompt(
    telemetry: IngestionOutput,
    context: MatcherContext,
    dossier: CandidateDossier
) {
    return `Anonymized candidate telemetry:
<telemetry>
${JSON.stringify(telemetry, null, 2)}
</telemetry>

Redacted candidate dossier (supporting evidence):
<dossier>
${JSON.stringify(compactDossier(dossier), null, 2)}
</dossier>

Job rubric:
<rubric>
${JSON.stringify(context.rubric, null, 2)}
</rubric>

Job description:
<job_description>
${usableDescription(context.description) ?? 'No description provided.'}
</job_description>

Preferred proven years (soft signal, never a hard gate):
<minimum_years_experience>
${context.minimumYearsExperience ?? 'Not set'}
</minimum_years_experience>

Audit the candidate against this rubric and description, then return the structured evaluation.`;
}

function normalize(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9+#.\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesTerm(haystack: string, term: string): boolean {
    const normalizedTerm = normalize(term);
    if (!normalizedTerm) return false;
    if (normalizedTerm.length < 2) return false;

    const pattern = new RegExp(
        `(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`,
        'i'
    );
    return pattern.test(haystack);
}

function artifactText(artifact: IngestionOutput['verifiableArtifacts'][number]) {
    return normalize(
        [
            artifact.type,
            artifact.title,
            artifact.summary,
            JSON.stringify(artifact.metrics),
        ].join(' ')
    );
}

function clampScore(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
}

const DESCRIPTION_STOP_WORDS = new Set([
    'a',
    'about',
    'across',
    'all',
    'also',
    'an',
    'and',
    'any',
    'are',
    'as',
    'at',
    'be',
    'build',
    'by',
    'can',
    'candidate',
    'candidates',
    'collaborate',
    'company',
    'cross',
    'deliver',
    'do',
    'environment',
    'excellent',
    'experience',
    'experiences',
    'fast',
    'field',
    'for',
    'from',
    'have',
    'help',
    'how',
    'in',
    'including',
    'into',
    'is',
    'it',
    'join',
    'least',
    'looking',
    'more',
    'must',
    'need',
    'needed',
    'needs',
    'of',
    'operate',
    'operating',
    'opportunity',
    'on',
    'or',
    'our',
    'own',
    'partner',
    'preferred',
    'product',
    'products',
    'related',
    'relevant',
    'requirements',
    'role',
    'services',
    'should',
    'strong',
    'team',
    'teams',
    'that',
    'the',
    'their',
    'them',
    'this',
    'to',
    'using',
    'we',
    'what',
    'while',
    'who',
    'will',
    'with',
    'work',
    'working',
    'you',
    'your',
]);

function descriptionTerms(description: string): string[] {
    const terms = normalize(description)
        .split(' ')
        .map((term) => term.replace(/^\.+|\.+$/g, ''))
        .filter(
            (term) =>
                term.length >= 2 && !DESCRIPTION_STOP_WORDS.has(term)
        );

    return [...new Set(terms)];
}

function scoreDescriptionAlignment(
    telemetry: IngestionOutput,
    description: string | null | undefined
): MatcherOutput['descriptionAudit'] {
    const trimmed = usableDescription(description);
    if (!trimmed) {
        return {
            score: 70,
            strengths: [],
            gaps: [],
            rationale:
                'No job description was provided; description alignment is neutral.',
        };
    }

    const terms = descriptionTerms(trimmed);
    if (terms.length === 0) {
        return {
            score: 70,
            strengths: [],
            gaps: [],
            rationale:
                'The job description has no comparable terms; description alignment is neutral.',
        };
    }

    const candidateText = normalize(
        [
            telemetry.domain,
            telemetry.educationLevel,
            ...telemetry.extractedSkills,
            ...telemetry.verifiableArtifacts.map(artifactText),
        ].join(' ')
    );

    const matched = terms.filter((term) =>
        matchesTerm(candidateText, term)
    );
    const missing = terms.filter(
        (term) => !matchesTerm(candidateText, term)
    );
    const coverage = matched.length / terms.length;
    const score = clampScore(35 + coverage * 65);

    return {
        score,
        strengths: matched
            .slice(0, 6)
            .map((term) => `Portfolio evidence aligned with "${term}".`),
        gaps: missing
            .slice(0, 6)
            .map((term) => `No direct portfolio evidence for "${term}".`),
        rationale: `Matched ${matched.length} of ${
            terms.length
        } meaningful description terms with verified portfolio evidence.`,
    };
}

function deriveProvenYears(telemetry: IngestionOutput): number | null {
    if (
        Number.isFinite(telemetry.yearsOfExperience) &&
        telemetry.yearsOfExperience > 0
    ) {
        return Math.round(telemetry.yearsOfExperience * 10) / 10;
    }

    // Zero from ingestion means "no years were extracted", not "proven zero".
    // The spec requires a neutral experience score when years are unverifiable.
    return null;
}

function scoreExperience(
    provenYears: number | null,
    targetYears: number | null
): { score: number; rationale: string } {
    if (targetYears === null) {
        return {
            score: 100,
            rationale:
                'No years target was set for this role; experience is not part of the combined score.',
        };
    }

    if (targetYears <= 0) {
        return {
            score: 100,
            rationale:
                'The role does not require prior years; experience is neutral.',
        };
    }

    if (provenYears === null) {
        return {
            score: 60,
            rationale:
                'Years not verifiable from the portfolio; a neutral experience score was applied. This soft signal does not gate eligibility.',
        };
    }

    const ratio = Math.min(Math.max(provenYears / targetYears, 0), 1);
    const score = clampScore(30 + ratio * 70);

    return {
        score,
        rationale:
            provenYears >= targetYears ?
                `Proven ${provenYears} years meets the preferred ${targetYears}-year target. This is a soft signal, not a hard gate.`
            :   `Proven ${provenYears} years is below the preferred ${targetYears}-year target. This is a soft signal; strong portfolio evidence can compensate.`,
    };
}

function combineScores(
    rubricScore: number,
    descriptionScore: number,
    experienceScore: number,
    targetYears: number | null
): number {
    if (targetYears !== null && targetYears > 0) {
        return clampScore(
            0.7 * rubricScore +
                0.2 * descriptionScore +
                0.1 * experienceScore
        );
    }

    return clampScore(0.7 * rubricScore + 0.3 * descriptionScore);
}

function categorize(
    unmetCount: number,
    matchScore: number,
    threshold: number
): MatcherOutput['category'] {
    if (unmetCount === 0 && matchScore >= threshold) {
        return 'ELIGIBLE';
    }

    if (
        unmetCount === 0 ||
        (unmetCount === 1 && matchScore >= 60)
    ) {
        return 'NEEDS_REVIEW';
    }

    return 'REDIRECTED';
}

function enforceEvaluation(
    evaluation: MatcherOutput,
    telemetry: IngestionOutput,
    context: MatcherContext
): MatcherOutput {
    const mandatoryCriteriaAudit = evaluation.mandatoryCriteriaAudit.map(
        (item) => ({
            ...item,
            evidenceFound: item.satisfied ? item.evidenceFound : null,
        })
    );

    const unmetRequirements = mandatoryCriteriaAudit
        .filter((item) => !item.satisfied)
        .map((item) => item.criterion);

    const rubricScore = clampScore(evaluation.rubricScore);
    const hasDescription = Boolean(usableDescription(context.description));
    const descriptionScore =
        hasDescription ?
            clampScore(evaluation.descriptionAudit.score)
        :   70;
    const heuristicDescription = scoreDescriptionAlignment(
        telemetry,
        context.description
    );

    const targetYears = context.minimumYearsExperience ?? null;
    const llmProvenYears = evaluation.experienceAudit.provenYears;
    const provenYears =
        typeof llmProvenYears === 'number' &&
        Number.isFinite(llmProvenYears) &&
        llmProvenYears >= 0 ?
            Math.round(llmProvenYears * 10) / 10
        :   deriveProvenYears(telemetry);
    const experience = scoreExperience(provenYears, targetYears);
    const experienceScore = experience.score;

    const matchScore = combineScores(
        rubricScore,
        descriptionScore,
        experienceScore,
        targetYears
    );
    const threshold = context.rubric.minimumScoreThreshold ?? 70;

    return {
        matchScore,
        rubricScore,
        category: categorize(
            unmetRequirements.length,
            matchScore,
            threshold
        ),
        mandatoryCriteriaAudit,
        descriptionAudit: {
            score: descriptionScore,
            strengths:
                evaluation.descriptionAudit.strengths.length > 0 ?
                    evaluation.descriptionAudit.strengths.slice(0, 6)
                :   heuristicDescription.strengths,
            gaps:
                evaluation.descriptionAudit.gaps.length > 0 ?
                    evaluation.descriptionAudit.gaps.slice(0, 6)
                :   heuristicDescription.gaps,
            rationale:
                !hasDescription ?
                    heuristicDescription.rationale
                :   evaluation.descriptionAudit.rationale.trim() ||
                    heuristicDescription.rationale,
        },
        experienceAudit: {
            targetYears,
            provenYears,
            score: experienceScore,
            rationale: experience.rationale,
        },
        strengths: evaluation.strengths.slice(0, 8),
        unmetRequirements,
    };
}

export function buildHeuristicEvaluation(
    telemetry: IngestionOutput,
    context: MatcherContext
): MatcherOutput {
    const { rubric } = context;
    const mandatoryAudit: MatcherOutput['mandatoryCriteriaAudit'] = [];
    const unmetRequirements: string[] = [];
    const strengths: string[] = [];
    const skillText = normalize(telemetry.extractedSkills.join(' '));
    const artifacts = telemetry.verifiableArtifacts.map((artifact) => ({
        artifact,
        text: artifactText(artifact),
    }));

    for (const criterion of rubric.mandatoryCriteria) {
        let evidence: string | null = null;

        const matchingSkill = telemetry.extractedSkills.find((skill) =>
            matchesTerm(normalize(criterion), skill)
        );

        if (matchingSkill) {
            evidence = `Candidate lists verified competency in ${matchingSkill}`;
        } else if (matchesTerm(skillText, criterion)) {
            evidence = 'Candidate skill set references this criterion';
        } else {
            const matchingArtifact = artifacts.find(({ text }) =>
                matchesTerm(text, criterion)
            );
            if (matchingArtifact) {
                evidence = `Verified artifact: ${matchingArtifact.artifact.title}`;
            }
        }

        if (evidence) {
            mandatoryAudit.push({
                criterion,
                satisfied: true,
                evidenceFound: evidence,
            });
            strengths.push(criterion);
        } else {
            mandatoryAudit.push({
                criterion,
                satisfied: false,
                evidenceFound: null,
            });
            unmetRequirements.push(criterion);
        }
    }

    const mandatoryTotal = rubric.mandatoryCriteria.length;
    const mandatoryMet = mandatoryAudit.filter((item) => item.satisfied).length;
    const baseScore =
        mandatoryTotal > 0 ? (mandatoryMet / mandatoryTotal) * 80 : 80;

    let preferredBonus = 0;
    const preferred = rubric.preferredCriteria ?? [];
    if (preferred.length > 0) {
        let preferredMet = 0;
        for (const criterion of preferred) {
            const matched =
                telemetry.extractedSkills.some((skill) =>
                    matchesTerm(normalize(criterion), skill)
                ) ||
                matchesTerm(skillText, criterion) ||
                artifacts.some(({ text }) => matchesTerm(text, criterion));

            if (matched) {
                preferredMet++;
                strengths.push(`Preferred: ${criterion}`);
            }
        }
        preferredBonus = (preferredMet / preferred.length) * 20;
    }

    const rubricScore = clampScore(baseScore + preferredBonus);
    const descriptionAudit = scoreDescriptionAlignment(
        telemetry,
        context.description
    );
    const targetYears = context.minimumYearsExperience ?? null;
    const provenYears = deriveProvenYears(telemetry);
    const experience = scoreExperience(provenYears, targetYears);
    const matchScore = combineScores(
        rubricScore,
        descriptionAudit.score,
        experience.score,
        targetYears
    );
    const threshold = rubric.minimumScoreThreshold ?? 70;

    return {
        matchScore,
        rubricScore,
        category: categorize(
            unmetRequirements.length,
            matchScore,
            threshold
        ),
        mandatoryCriteriaAudit: mandatoryAudit,
        descriptionAudit,
        experienceAudit: {
            targetYears,
            provenYears,
            score: experience.score,
            rationale: experience.rationale,
        },
        strengths,
        unmetRequirements,
    };
}

export class MatcherAgent {
    async run(
        applicationId: string,
        telemetry: IngestionOutput,
        context: MatcherContext,
        dossier: CandidateDossier
    ): Promise<MatcherOutput> {
        const runtime = getLlmRuntime();

        if (runtime) {
            try {
                const { object, usage } = await generateObject({
                    model: runtime.model,
                    schema: MatcherOutputSchema,
                    schemaName: 'MatcherOutput',
                    schemaDescription:
                        'Evidence-based rubric and description evaluation for an anonymized candidate.',
                    system: MATCHER_SYSTEM_PROMPT,
                    prompt: buildMatcherPrompt(telemetry, context, dossier),
                    temperature: runtime.temperature,
                    maxRetries: runtime.maxRetries,
                    maxOutputTokens: 3000,
                });

                const output = enforceEvaluation(
                    object,
                    telemetry,
                    context
                );

                await logAgentExecution({
                    applicationId,
                    agentType: 'matcher',
                    modelUsed: getLlmModelUsed(runtime),
                    usage,
                    rawInput: {
                        telemetry,
                        context,
                        dossier: compactDossier(dossier),
                    },
                    structuredOutput: output,
                });

                return output;
            } catch (error) {
                console.warn(
                    `[agents:matcher] LLM call failed (${describeError(
                        error
                    )}); using heuristic fallback.`
                );
            }
        }

        const output = buildHeuristicEvaluation(telemetry, context);

        await logAgentExecution({
            applicationId,
            agentType: 'matcher',
            modelUsed: 'heuristic-rubric-matcher-v3',
            rawInput: {
                telemetry,
                context,
                dossier: compactDossier(dossier),
            },
            structuredOutput: output,
        });

        return output;
    }
}

export const matcherAgent = new MatcherAgent();
