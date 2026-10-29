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
    badge: z.literal('ACTIONABLE GAP ANALYSIS [ZERO GHOSTING]'),
    headlineReason: z.string(),
    verifiedStrengths: z.array(z.string()),
    unmetMandatoryReasons: z.array(z.string()),
    recommendedBridgePath: z.object({
        title: z.string(),
        actionableMilestones: z.array(z.string()),
        reapplicationReadinessMilestone: z.string(),
    }),
});

export type GrowthOutput = z.infer<typeof GrowthOutputSchema>;

const GROWTH_SYSTEM_PROMPT = `You are the Skillora Growth Agent, the "Zero-Ghosting Coach". You write for a candidate whose application was REJECTED because it did not yet meet the mandatory rubric.

Voice and ethics:
- Be empathetic, direct, and respectful. Never blame the candidate.
- Never mention or infer protected characteristics, age, gender, nationality, religion, disability, or family status.
- Base every statement on the supplied evaluation and telemetry. Do not invent missing requirements.

Roadmap rules:
1. Explain the decision through the specific unmet mandatory criteria.
2. Produce 3 to 5 practical milestones that create verifiable proof, tailored to the candidate's domain and missing criteria.
3. Every milestone must be completable and must produce an artifact the candidate can attach to a future application (repository, deployed service, case brief, audit memo, financial model, certificate, measurable report).
4. Domain-specific examples:
   - Tech: containerize a service with Docker, deploy with Helm on Kubernetes, add CI with tests, publish a repository with measurable results.
   - Legal: draft a contract compliance audit brief, map relevant Algerian jurisprudence, produce a redacted case memo.
   - Finance/operations: build a reconciled model, document internal controls, quantify cost savings with a baseline.
5. Never give generic advice such as "study more", "take a course", "improve your skills", or "network more".
6. reapplicationReadinessMilestone must state the exact evidence required before re-applying.
7. badge must be exactly "ACTIONABLE GAP ANALYSIS [ZERO GHOSTING]".
8. The redacted dossier is supporting context. URLs are removed for privacy; build on the candidate's real domain and artifacts, but never invent experience.
9. The response must match the provided schema exactly.`;

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

    let bridgeTitle = `Bridge competency in ${primaryMissing}`;
    let milestones: string[] = [];
    let readyMilestone = `Re-apply to similar openings once ${primaryMissing} is demonstrated.`;

    if (telemetry.domain === 'tech') {
        bridgeTitle = `Deploy a project demonstrating ${primaryMissing}`;
        milestones = [
            `Implement a standalone prototype using ${primaryMissing} with automated tests.`,
            `Containerize the service with Docker and deploy it with a reproducible manifest.`,
            `Add a continuous delivery workflow (GitHub Actions) verifying your configuration.`,
        ];
        readyMilestone = `Push to a public repository with a passing pipeline and link the verified repo on your next application.`;
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

    return {
        badge: 'ACTIONABLE GAP ANALYSIS [ZERO GHOSTING]',
        headlineReason: `Why your profile was not selected for this cohort (${positionTitle})`,
        verifiedStrengths: evaluation.strengths.slice(0, 4),
        unmetMandatoryReasons: unmetList.map(
            (requirement) => `Missing mandatory requirement: ${requirement}`
        ),
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
                    maxOutputTokens: 2500,
                });

                const output: GrowthOutput = {
                    ...object,
                    badge: 'ACTIONABLE GAP ANALYSIS [ZERO GHOSTING]',
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
