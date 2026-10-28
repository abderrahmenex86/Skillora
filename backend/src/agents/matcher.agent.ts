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
    category: z.enum(['ELIGIBLE', 'NEEDS_REVIEW', 'REDIRECTED']),
    mandatoryCriteriaAudit: z.array(
        z.object({
            criterion: z.string(),
            satisfied: z.boolean(),
            evidenceFound: z.string().nullable(),
        })
    ),
    strengths: z.array(z.string()),
    unmetRequirements: z.array(z.string()),
});

export type MatcherOutput = z.infer<typeof MatcherOutputSchema>;

export interface Rubric {
    mandatoryCriteria: string[];
    preferredCriteria?: string[];
    minimumScoreThreshold?: number;
}

const MATCHER_SYSTEM_PROMPT = `You are the Skillora Matcher Agent. You evaluate an anonymized candidate dossier against a recruiter's rubric using evidence, not keyword matching.

Evaluation rules:
1. Audit every mandatory criterion individually. A criterion is satisfied only when the dossier contains concrete evidence: a project, repository, certification, degree, dated role, quantified outcome, or an explicitly listed skill used in an artifact.
2. Do not infer evidence from a job title alone. Distinguish "claims a skill" from "demonstrated the skill in a verifiable artifact".
3. For each criterion, put a short factual evidence summary in evidenceFound. Use null when there is no evidence. Never fabricate evidence.
4. Preferred criteria may increase the score but can never compensate for an unmet mandatory criterion.
5. Score from 0 to 100:
   - Up to 80 points for the proportion of mandatory criteria satisfied.
   - Up to 20 points for the proportion of preferred criteria satisfied.
   - Respect the rubric's minimumScoreThreshold.
6. Category:
   - ELIGIBLE only when every mandatory criterion is satisfied and matchScore >= minimumScoreThreshold.
   - NEEDS_REVIEW when at most one mandatory criterion is unmet, or when the available evidence is plausible but ambiguous.
   - REDIRECTED otherwise.
7. unmetRequirements must contain only mandatory criteria that are not satisfied.
8. Be strict, objective, and consistent. Never reward keyword stuffing or unverifiable claims.
9. The redacted dossier is supporting evidence. URLs have been removed for privacy; never treat a missing URL as missing evidence.
10. The response must match the provided schema exactly.`;

function buildMatcherPrompt(
    telemetry: IngestionOutput,
    rubric: Rubric,
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
${JSON.stringify(rubric, null, 2)}
</rubric>

Audit the candidate against this rubric and return the structured evaluation.`;
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

function enforceEvaluation(
    evaluation: MatcherOutput,
    rubric: Rubric
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

    const matchScore = Math.max(
        0,
        Math.min(100, Math.round(evaluation.matchScore))
    );
    const threshold = rubric.minimumScoreThreshold ?? 70;

    let category: MatcherOutput['category'];
    if (unmetRequirements.length === 0 && matchScore >= threshold) {
        category = 'ELIGIBLE';
    } else if (unmetRequirements.length <= 1 && matchScore >= 60) {
        category = 'NEEDS_REVIEW';
    } else {
        category = 'REDIRECTED';
    }

    return {
        matchScore,
        category,
        mandatoryCriteriaAudit,
        strengths: evaluation.strengths,
        unmetRequirements,
    };
}

function buildHeuristicEvaluation(
    telemetry: IngestionOutput,
    rubric: Rubric
): MatcherOutput {
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

    const matchScore = Math.round(baseScore + preferredBonus);
    const threshold = rubric.minimumScoreThreshold ?? 70;

    let category: MatcherOutput['category'] = 'REDIRECTED';
    if (unmetRequirements.length === 0 && matchScore >= threshold) {
        category = 'ELIGIBLE';
    } else if (unmetRequirements.length <= 1 && matchScore >= 60) {
        category = 'NEEDS_REVIEW';
    }

    return {
        matchScore,
        category,
        mandatoryCriteriaAudit: mandatoryAudit,
        strengths,
        unmetRequirements,
    };
}

export class MatcherAgent {
    async run(
        applicationId: string,
        telemetry: IngestionOutput,
        rubric: Rubric,
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
                        'Evidence-based rubric evaluation for an anonymized candidate.',
                    system: MATCHER_SYSTEM_PROMPT,
                    prompt: buildMatcherPrompt(telemetry, rubric, dossier),
                    temperature: runtime.temperature,
                    maxRetries: runtime.maxRetries,
                    maxOutputTokens: 2200,
                });

                const output = enforceEvaluation(object, rubric);

                await logAgentExecution({
                    applicationId,
                    agentType: 'matcher',
                    modelUsed: getLlmModelUsed(runtime),
                    usage,
                    rawInput: { telemetry, rubric, dossier: compactDossier(dossier) },
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

        const output = buildHeuristicEvaluation(telemetry, rubric);

        await logAgentExecution({
            applicationId,
            agentType: 'matcher',
            modelUsed: 'heuristic-rubric-matcher-v2',
            rawInput: { telemetry, rubric, dossier: compactDossier(dossier) },
            structuredOutput: output,
        });

        return output;
    }
}

export const matcherAgent = new MatcherAgent();
