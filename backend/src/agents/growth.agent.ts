import { generateObject } from 'ai';
import { z } from 'zod';
import { logAgentExecution } from './agent-log.js';
import {
    compactDossier,
    type CandidateDossier,
} from './dossier.js';
import { MatcherOutput } from './matcher.agent.js';
import { IngestionOutput } from './ingestion.agent.js';
import {
    describeError,
    getLlmModelUsed,
    getLlmRuntime,
} from './model.factory.js';

export const GrowthOutputSchema = z.object({
    letter: z.string(),
    verifiedStrengths: z.array(z.string()),
    unmetMandatoryReasons: z.array(z.string()),
    descriptionGaps: z.array(z.string()),
    experienceNote: z.string(),
    recommendedBridgePath: z.object({
        title: z.string(),
        actionableMilestones: z.array(z.string()),
        reapplicationReadinessMilestone: z.string(),
    }),
});

export type GrowthOutput = z.infer<typeof GrowthOutputSchema>;

const GROWTH_SYSTEM_PROMPT = `You are the Skillora Growth Agent. You write formal, constructive feedback for a candidate whose application was rejected because it did not yet meet the mandatory rubric.

Voice and ethics:
- Be empathetic, direct, respectful, and formal. Never blame the candidate or imply they are not good enough.
- Never mention or infer protected characteristics, age, gender, nationality, religion, disability, or family status.
- Base every statement on the supplied evaluation and telemetry. Never invent missing requirements, experience, or credentials.

Letter rules:
1. The letter must begin with "Dear candidate," and end with "Skillora Talent Team".
2. Use 3 to 5 short paragraphs and approximately 150-250 words.
3. Acknowledge 2 to 3 verified strengths from the candidate's application.
4. Explain that other candidates demonstrated stronger coverage of the mandatory requirements for this particular role. Make clear this is about fit for this posting, not the candidate's overall ability.
5. Name the specific missing mandatory qualification(s) and explain what proof was not found. For example: "The main gap for this role was the absence of proven Kubernetes experience."
6. If the evaluation has description gaps, mention 1 or 2 of them as additional evidence the posting emphasized. If the evaluation has a years target, add one sentence explaining that the preferred years are a soft signal and that strong portfolio evidence can compensate. Never imply the candidate was rejected only for fewer years.
7. Offer practical direction for future applications: relevant projects, artifacts, or recognized certifications that would create verifiable proof. Do not give generic advice such as "study more", "take a course", "improve your skills", or "network more".
8. Encourage the candidate to re-apply once the suggested evidence is in place.
9. The structured recommendedBridgePath must contain 3 to 5 practical milestones, each producing an attachable artifact. reapplicationReadinessMilestone must state the exact evidence required before re-applying.
10. descriptionGaps must list the posting's description gaps that the candidate should close, or an empty array when there are none. experienceNote must state the preferred years and that the signal is soft, or state that no years target was set.
11. The redacted dossier is supporting context. URLs are removed for privacy; build on the candidate's real domain and artifacts.
12. The response must match the provided schema exactly. Do not include a badge, headline, or internal status labels in the letter.`;
function buildGrowthPrompt(
    telemetry: IngestionOutput,
    evaluation: MatcherOutput,
    positionTitle: string,
    dossier: CandidateDossier
) {
    return `Position: ${positionTitle}

Anonymized candidate telemetry:
<telemetry>
${JSON.stringify(telemetry, null, 2)}
</telemetry>

Redacted candidate dossier (supporting context):
<dossier>
${JSON.stringify(compactDossier(dossier), null, 2)}
</dossier>

Matcher evaluation:
<evaluation>
${JSON.stringify(evaluation, null, 2)}
</evaluation>

Write the Zero-Ghosting growth roadmap for this rejected candidate.`;
}

function buildDescriptionGaps(evaluation: MatcherOutput): string[] {
    return (evaluation.descriptionAudit?.gaps ?? []).slice(0, 4);
}

function buildExperienceNote(evaluation: MatcherOutput): string {
    const targetYears = evaluation.experienceAudit?.targetYears ?? null;
    const provenYears = evaluation.experienceAudit?.provenYears ?? null;

    if (targetYears === null) {
        return 'No years target was set for this role.';
    }

    if (targetYears <= 0) {
        return 'The role does not require prior years of experience.';
    }

    if (provenYears === null) {
        return `The role lists ${targetYears} preferred years of experience. Years could not be verified from the portfolio, but this is a soft preference and your portfolio evidence can compensate.`;
    }

    if (provenYears >= targetYears) {
        return `The role lists ${targetYears} preferred years of experience, and your ${provenYears} proven years meet that preference.`;
    }

    return `The role lists ${targetYears} preferred years of experience, and your ${provenYears} proven years is a soft signal: strong portfolio evidence can compensate, so years alone did not decide this outcome.`;
}

function buildHeuristicGrowth(
    telemetry: IngestionOutput,
    evaluation: MatcherOutput,
    positionTitle: string
): GrowthOutput {
    const unmetList =
        evaluation.unmetRequirements.length > 0 ?
            evaluation.unmetRequirements
        :   ['Specific specialized tooling or verified volume metrics'];

    const primaryMissing = unmetList[0];
    const descriptionGaps = buildDescriptionGaps(evaluation);
    const experienceNote = buildExperienceNote(evaluation);

    let bridgeTitle = `Bridge competency in ${primaryMissing}`;
    let milestones: string[] = [];
    let readyMilestone = `Re-apply to similar openings once ${primaryMissing} is demonstrated.`;

    if (telemetry.domain === 'tech') {
        bridgeTitle = `Deploy a project demonstrating ${primaryMissing}`;
        milestones = [
            `Implement a standalone prototype using ${primaryMissing} with automated tests.`,
            `Containerize the service with Docker and deploy it with a reproducible manifest.`,
            `Add a continuous delivery workflow (GitHub Actions) verifying your configuration.`,
            `Earn a recognized certification covering ${primaryMissing} if one is available, or publish a production-grade equivalent.`,
        ];
        readyMilestone = `Push to a public repository with a passing pipeline and attach any relevant certification before your next application.`;
    } else if (telemetry.domain === 'legal') {
        bridgeTitle = `Complete a practical case brief addressing ${primaryMissing}`;
        milestones = [
            `Draft a mock regulatory compliance audit covering ${primaryMissing}.`,
            `Synthesize commercial contract terms referencing relevant Algerian jurisprudence.`,
            `Produce a redacted case memo with a clear risk matrix and recommendations.`,
        ];
        readyMilestone = `Upload the case brief and risk matrix to your profile portfolio before the next cohort.`;
    } else if (telemetry.domain === 'finance') {
        bridgeTitle = `Build a verifiable financial artifact for ${primaryMissing}`;
        milestones = [
            `Build a reconciled financial model with documented assumptions for ${primaryMissing}.`,
            `Add a controls checklist and a sensitivity analysis to the model.`,
            `Quantify the impact against a clear baseline and summarize it in a one-page memo.`,
        ];
        readyMilestone = `Attach the model and memo to your next application as verifiable evidence.`;
    } else {
        bridgeTitle = `Demonstrate certified mastery of ${primaryMissing}`;
        milestones = [
            `Complete a recognized practical assessment or case study in ${primaryMissing}.`,
            `Document the process, decisions, and measurable outcome in a shareable artifact.`,
            `Quantify past project impact with clear baseline metrics.`,
        ];
    }

    const strengths = evaluation.strengths.slice(0, 3);
    const missing = unmetList.slice(0, 2);
    const descriptionNote =
        descriptionGaps.length > 0 ?
            ` The role description also emphasized ${descriptionGaps
                .slice(0, 2)
                .map((gap) =>
                    gap
                        .replace(
                            /^No direct portfolio evidence for\s*/i,
                            ''
                        )
                        .replace(/^["']|["'.]+$/g, '')
                )
                .join(' and ')}, so verifiable evidence of that work would make your next application stronger.`
        : '';
    const yearsNote =
        (evaluation.experienceAudit?.targetYears ?? 0) > 0 ?
            ` ${experienceNote}`
        : '';
    const letter = `Dear candidate,

Thank you for applying for ${positionTitle}. Your application demonstrated meaningful strengths${strengths.length > 0 ? ` in ${strengths.join(', ')}` : ''}. However, this was a competitive cohort, and other candidates demonstrated stronger coverage of the mandatory requirements for this particular role.

The main gap for this posting was ${missing.join(' and ')}. The review did not find sufficient verifiable proof of that capability in the submitted resume.${descriptionNote}${yearsNote}

To strengthen future applications, focus on producing concrete artifacts related to the missing requirement, such as the project or certification path outlined below. Once that evidence is attached to your profile, you are encouraged to apply again.

Skillora Talent Team`;
    return {
        letter,
        verifiedStrengths: strengths,
        unmetMandatoryReasons: unmetList.map(
            (requirement) => `Missing mandatory requirement: ${requirement}`
        ),
        descriptionGaps,
        experienceNote,
        recommendedBridgePath: {
            title: bridgeTitle,
            actionableMilestones: milestones,
            reapplicationReadinessMilestone: readyMilestone,
        },
    };
}

export class GrowthAgent {
    async run(
        applicationId: string,
        telemetry: IngestionOutput,
        evaluation: MatcherOutput,
        positionTitle: string,
        dossier: CandidateDossier
    ): Promise<GrowthOutput> {
        const runtime = getLlmRuntime();

        if (runtime) {
            try {
                const { object, usage } = await generateObject({
                    model: runtime.model,
                    schema: GrowthOutputSchema,
                    schemaName: 'GrowthOutput',
                    schemaDescription:
                        'Empathetic, evidence-specific growth roadmap for a rejected candidate.',
                    system: GROWTH_SYSTEM_PROMPT,
                    prompt: buildGrowthPrompt(
                        telemetry,
                        evaluation,
                        positionTitle,
                        dossier
                    ),
                    temperature: Math.max(runtime.temperature, 0.3),
                    maxRetries: runtime.maxRetries,
                    maxOutputTokens: 3000,
                });

                const output: GrowthOutput = {
                    ...object,
                    verifiedStrengths:
                        object.verifiedStrengths.length > 0 ?
                            object.verifiedStrengths.slice(0, 6)
                        :   evaluation.strengths.slice(0, 4),
                    unmetMandatoryReasons:
                        object.unmetMandatoryReasons.length > 0 ?
                            object.unmetMandatoryReasons
                        :   evaluation.unmetRequirements.map(
                                (requirement) =>
                                    `Missing mandatory requirement: ${requirement}`
                            ),
                    descriptionGaps:
                        object.descriptionGaps.length > 0 ?
                            object.descriptionGaps.slice(0, 4)
                        :   buildDescriptionGaps(evaluation),
                    experienceNote:
                        object.experienceNote.trim() ||
                        buildExperienceNote(evaluation),
                };

                await logAgentExecution({
                    applicationId,
                    agentType: 'growth',
                    modelUsed: getLlmModelUsed(runtime),
                    usage,
                    rawInput: {
                        telemetry,
                        evaluation,
                        positionTitle,
                        dossier: compactDossier(dossier),
                    },
                    structuredOutput: output,
                });

                return output;
            } catch (error) {
                console.warn(
                    `[agents:growth] LLM call failed (${describeError(
                        error
                    )}); using heuristic fallback.`
                );
            }
        }

        const output = buildHeuristicGrowth(
            telemetry,
            evaluation,
            positionTitle
        );

        await logAgentExecution({
            applicationId,
            agentType: 'growth',
            modelUsed: 'heuristic-growth-synthesis-v2',
            rawInput: {
                telemetry,
                evaluation,
                positionTitle,
                dossier: compactDossier(dossier),
            },
            structuredOutput: output,
        });

        return output;
    }
}

export const growthAgent = new GrowthAgent();
