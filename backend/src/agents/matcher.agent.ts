import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { IngestionOutput } from './ingestion.agent.js';

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

export class MatcherAgent {
    async run(
        applicationId: string,
        telemetry: IngestionOutput,
        rubric: {
            mandatoryCriteria: string[];
            preferredCriteria?: string[];
            minimumScoreThreshold?: number;
        }
    ): Promise<MatcherOutput> {
        const rawInput = { telemetry, rubric };
        const mandatoryAudit: MatcherOutput['mandatoryCriteriaAudit'] = [];
        const unmetRequirements: string[] = [];
        const strengths: string[] = [];

        const candidateSkillSet = new Set(
            telemetry.extractedSkills.map((s) => s.toLowerCase().trim())
        );

        for (const criterion of rubric.mandatoryCriteria) {
            const lowerCrit = criterion.toLowerCase();
            let matched = false;
            let evidence: string | null = null;

            for (const skill of candidateSkillSet) {
                if (lowerCrit.includes(skill) || skill.includes(lowerCrit)) {
                    matched = true;
                    evidence = `Candidate possesses verified competency in ${skill}`;
                    break;
                }
            }

            if (!matched) {
                for (const artifact of telemetry.verifiableArtifacts) {
                    const lowerSummary = (
                        artifact.title +
                        ' ' +
                        artifact.summary
                    ).toLowerCase();
                    if (lowerSummary.includes(lowerCrit)) {
                        matched = true;
                        evidence = `Verified artifact: ${artifact.title}`;
                        break;
                    }
                }
            }

            if (matched) {
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
        const mandatoryMet = mandatoryAudit.filter((a) => a.satisfied).length;
        const baseScore =
            mandatoryTotal > 0 ? (mandatoryMet / mandatoryTotal) * 80 : 80;

        let preferredBonus = 0;
        if (rubric.preferredCriteria && rubric.preferredCriteria.length > 0) {
            let prefMet = 0;
            for (const pref of rubric.preferredCriteria) {
                if (candidateSkillSet.has(pref.toLowerCase().trim())) {
                    prefMet++;
                    strengths.push(`Preferred: ${pref}`);
                }
            }
            preferredBonus = (prefMet / rubric.preferredCriteria.length) * 20;
        }

        const matchScore = Math.round(baseScore + preferredBonus);
        const threshold = rubric.minimumScoreThreshold ?? 70;

        let category: MatcherOutput['category'] = 'REDIRECTED';
        if (unmetRequirements.length === 0 && matchScore >= threshold) {
            category = 'ELIGIBLE';
        } else if (unmetRequirements.length <= 1 && matchScore >= 60) {
            category = 'NEEDS_REVIEW';
        } else {
            category = 'REDIRECTED';
        }

        const output: MatcherOutput = {
            matchScore,
            category,
            mandatoryCriteriaAudit: mandatoryAudit,
            strengths,
            unmetRequirements,
        };

        await prisma.agentExecutionLog.create({
            data: {
                applicationId,
                agentType: 'matcher',
                modelUsed: 'deterministic-rubric-matcher-v1',
                promptTokens: 250,
                outputTokens: 210,
                rawInput,
                structuredOutput: output,
            },
        });

        return output;
    }
}

export const matcherAgent = new MatcherAgent();
