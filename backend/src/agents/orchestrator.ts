import { prisma } from '../db/prisma.js';
import { ingestionAgent } from './ingestion.agent.js';
import { matcherAgent } from './matcher.agent.js';
import { growthAgent } from './growth.agent.js';
import { coordinatorAgent } from './coordinator.agent.js';
import { buildCandidateDossier } from './dossier.js';
import { notifyApplicationStatus } from '../services/messages.js';

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

        let nextStatus: 'ELIGIBLE' | 'NEEDS_REVIEW' | 'REDIRECTED' =
            evaluation.category;

        if (nextStatus === 'ELIGIBLE') {
            const capacity = application.position.interviewCapacity;
            const existingInterview = await prisma.interviewEvent.findUnique({
                where: { applicationId },
                select: { id: true },
            });
            const usedInterviews = await prisma.interviewEvent.count({
                where: {
                    application: {
                        positionId: application.position.id,
                    },
                },
            });
            const hasCapacity =
                capacity === null ||
                existingInterview !== null ||
                usedInterviews < capacity;

            if (hasCapacity) {
                const coordination =
                    await coordinatorAgent.proposeSlotsForCandidate(
                        applicationId,
                        application.position.recruiterId,
                        application.position.id
                    );

                if (coordination.proposedSlots.length === 0) {
                    nextStatus = 'NEEDS_REVIEW';
                } else {
                    await prisma.interviewEvent.upsert({
                        where: { applicationId },
                        create: {
                            applicationId,
                            applicantId: application.applicantId,
                            recruiterId: application.position.recruiterId,
                            status: 'RANGE_PENDING',
                            proposedRanges: coordination.proposedSlots as any,
                        },
                        update: {
                            status: 'RANGE_PENDING',
                            proposedRanges: coordination.proposedSlots as any,
                        },
                    });

                    nextStatus = 'INTERVIEW_PENDING' as any;
                }
            } else {
                nextStatus = 'NEEDS_REVIEW';
            }
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
