import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';

const redisOptions = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
};

/**
 * Worker connection. BullMQ requires `maxRetriesPerRequest: null` for workers,
 * so this connection keeps retrying until Redis becomes available.
 */
export const redisConnection = new Redis({
    ...redisOptions,
    maxRetriesPerRequest: null,
});

let workerErrorLogged = false;
redisConnection.on('error', (error) => {
    if (!workerErrorLogged) {
        workerErrorLogged = true;
        console.warn(
            `[queue] Worker Redis unavailable: ${error.message}. The worker will retry in the background.`
        );
    }
});
redisConnection.on('ready', () => {
    workerErrorLogged = false;
});

/**
 * Producer connection. It gives up quickly instead of queueing commands
 * forever, so an HTTP request never hangs when Redis is offline. A later
 * enqueue attempt reconnects, so Redis can be started without a server
 * restart.
 */
export const queueConnection = new Redis({
    ...redisOptions,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy: (times) => (times > 2 ? null : times * 200),
});

let producerErrorLogged = false;
queueConnection.on('error', (error) => {
    if (!producerErrorLogged) {
        producerErrorLogged = true;
        console.warn(
            `[queue] Producer Redis unavailable: ${error.message}. Evaluations will run inline until Redis is reachable.`
        );
    }
});
queueConnection.on('ready', () => {
    producerErrorLogged = false;
});

export const EVALUATION_QUEUE_NAME = 'application-evaluation-queue';

export const evaluationQueue = new Queue(EVALUATION_QUEUE_NAME, {
    connection: queueConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

let queueErrorLogged = false;
evaluationQueue.on('error', (error) => {
    if (!queueErrorLogged) {
        queueErrorLogged = true;
        console.warn(`[queue] Evaluation queue unavailable: ${error.message}`);
    }
});
queueConnection.on('ready', () => {
    queueErrorLogged = false;
});

/**
 * Enqueue an evaluation without ever blocking the caller indefinitely.
 * Returns false when Redis is unreachable so the caller can run the
 * evaluation inline instead.
 */
export async function enqueueEvaluation(
    applicationId: string
): Promise<boolean> {
    try {
        if (queueConnection.status === 'end') {
            await queueConnection.connect();
        }

        await evaluationQueue.add(
            'evaluate-application',
            { applicationId },
            { jobId: applicationId }
        );

        return true;
    } catch (error) {
        console.warn(
            `[queue] Could not enqueue evaluation for ${applicationId}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
        return false;
    }
}
