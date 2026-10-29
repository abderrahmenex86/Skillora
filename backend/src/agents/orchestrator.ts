import { prisma } from '../db/prisma.js';
import { ingestionAgent } from './ingestion.agent.js';
import { matcherAgent } from './matcher.agent.js';
import { growthAgent } from './growth.agent.js';
import { buildCandidateDossier } from './dossier.js';
import { notifyApplicationStatus } from '../services/messages.js';
import { scheduleApplicationInterview } from '../services/interview-scheduling.js';

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

        const dossier = await buildCandidateDossier(application.profile);

        const telemetry = await ingestionAgent.run(
            applicationId,
            dossier,
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
            rubric,
            dossier
        );

        let nextStatus: 'NEEDS_REVIEW' | 'REJECTED' | 'INTERVIEW_SCHEDULED' | 'ON_HOLD';

        if (evaluation.category === 'ELIGIBLE') {
            const outcome = await scheduleApplicationInterview(applicationId);
            nextStatus = outcome.status;
        } else {
            nextStatus =
                evaluation.category === 'REDIRECTED' ?
                    'REJECTED'
                :   'NEEDS_REVIEW';
        }

        let gapAnalysis: any = null;

        if (evaluation.category === 'REDIRECTED') {
            gapAnalysis = await growthAgent.run(
                applicationId,
                telemetry,
                evaluation,
                application.position.title,
                dossier
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

        await notifyApplicationStatus(applicationId, updatedApplication.status);

        return updatedApplication;
    }
}

export const agentOrchestrator = new AgentOrchestrator();
