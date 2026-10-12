import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { MatcherOutput } from './matcher.agent.js';
import { IngestionOutput } from './ingestion.agent.js';

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

export class GrowthAgent {
    async run(
        applicationId: string,
        telemetry: IngestionOutput,
        evaluation: MatcherOutput,
        positionTitle: string
    ): Promise<GrowthOutput> {
        const rawInput = { telemetry, evaluation, positionTitle };

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
                `Add a continuous delivery workflow (GitHub Actions) verifying your configuration.`,
            ];
            readyMilestone = `Push to a public repository and link the verified repo on your next application.`;
        } else if (telemetry.domain === 'legal') {
            bridgeTitle = `Complete practical case brief addressing ${primaryMissing}`;
            milestones = [
                `Draft a mock regulatory compliance audit covering ${primaryMissing}.`,
                `Synthesize commercial contract terms referencing relevant Algerian jurisprudence.`,
            ];
            readyMilestone = `Upload the case brief to your profile portfolio before next cohort.`;
        } else {
            bridgeTitle = `Demonstrate certified mastery of ${primaryMissing}`;
            milestones = [
                `Complete a recognized practical assessment or case study in ${primaryMissing}.`,
                `Quantify past project impact with clear baseline metrics.`,
            ];
        }

        const output: GrowthOutput = {
            badge: 'ACTIONABLE GAP ANALYSIS [ZERO GHOSTING]',
            headlineReason: `Why your profile was not selected for this cohort (${positionTitle})`,
            verifiedStrengths: evaluation.strengths.slice(0, 4),
            unmetMandatoryReasons: unmetList.map(
                (req) => `Missing mandatory requirement: ${req}`
            ),
            recommendedBridgePath: {
                title: bridgeTitle,
                actionableMilestones: milestones,
                reapplicationReadinessMilestone: readyMilestone,
            },
        };

        await prisma.agentExecutionLog.create({
            data: {
                applicationId,
                agentType: 'growth',
                modelUsed: 'growth-synthesis-v1',
                promptTokens: 300,
                outputTokens: 250,
                rawInput,
                structuredOutput: output,
            },
        });

        return output;
    }
}

export const growthAgent = new GrowthAgent();
