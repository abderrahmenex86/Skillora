import { Worker, Job } from 'bullmq';
import { redisConnection, EVALUATION_QUEUE_NAME } from './queue.config.js';
import { agentOrchestrator } from '../agents/orchestrator.js';

export const evaluationWorker = new Worker(
    EVALUATION_QUEUE_NAME,
    async (job: Job<{ applicationId: string }>) => {
        const { applicationId } = job.data;
        const result =
            await agentOrchestrator.evaluateApplication(applicationId);
        return {
            applicationId,
            status: result.status,
            matchScore: result.matchScore,
        };
    },
    {
        connection: redisConnection,
        concurrency: 5,
    }
);

evaluationWorker.on('completed', (job) => {
    console.log(`Application evaluation completed for job ${job.id}`);
});

evaluationWorker.on('failed', (job, err) => {
    console.error(`Evaluation failed for job ${job?.id}:`, err);
});
