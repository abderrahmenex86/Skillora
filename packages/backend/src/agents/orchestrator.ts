import { prisma } from '../db/prisma.js';
import { ingestionAgent } from './ingestion.agent.js';
import { matcherAgent } from './matcher.agent.js';
import { growthAgent } from './growth.agent.js';

export class AgentOrchestrator {
    async evaluateApplication(applicationId: string) {
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                position: true,
                profile: true,
            },
        });

        if (!application) {
            throw new Error(`Application ${applicationId} not found`);
        }

        await prisma.application.update({
            where: { id: applicationId },
            data: { status: 'EVALUATING' },
        });

        const telemetry = await ingestionAgent.run(
            applicationId,
            application.profile,
            application.anonymousId
        );

        const rubric = application.position.rubric as {
            mandatoryCriteria: string[];
            preferredCriteria?: string[];
            minimumScoreThreshold?: number;
        };

        const evaluation = await matcherAgent.run(
            applicationId,
            telemetry,
            rubric
        );

        let nextStatus: 'ELIGIBLE' | 'NEEDS_REVIEW' | 'REDIRECTED' =
            evaluation.category;
        let gapAnalysis: any = null;

        if (evaluation.category === 'REDIRECTED') {
            gapAnalysis = await growthAgent.run(
                applicationId,
                telemetry,
                evaluation,
                application.position.title
            );
        }

        const updatedApplication = await prisma.application.update({
            where: { id: applicationId },
            data: {
                status: nextStatus,
                matchScore: evaluation.matchScore,
                rubricAudit: evaluation as any,
                gapAnalysis: gapAnalysis,
            },
        });

        return updatedApplication;
    }
}

export const agentOrchestrator = new AgentOrchestrator();
