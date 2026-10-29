import 'dotenv/config';
import { existsSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { agentOrchestrator } from '../src/agents/orchestrator.js';

const envPath = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend/.env'),
].find(existsSync);

if (envPath) {
    dotenv.config({ path: envPath });
}

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const option = (name: string) => {
    const prefix = `--${name}=`;
    return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};
const maxAgeMinutes = Number(option('max-age-minutes') ?? 2);
const limit = Number(option('limit') ?? 50);

if (!Number.isFinite(maxAgeMinutes) || maxAgeMinutes < 0) {
    throw new Error('--max-age-minutes must be a non-negative number');
}
if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('--limit must be a positive integer');
}

async function main(): Promise<void> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    const applications = await prisma.application.findMany({
        where: {
            status: { in: ['SUBMITTED', 'EVALUATING'] },
            appliedAt: { lt: cutoff },
        },
        orderBy: { appliedAt: 'asc' },
        take: limit,
        select: {
            id: true,
            status: true,
            appliedAt: true,
            position: { select: { title: true } },
        },
    });

    console.log(
        `Found ${applications.length} pending application(s) older than ${maxAgeMinutes} minute(s).`
    );

    for (const application of applications) {
        console.log(
            `- ${application.id} | ${application.status} | ${application.position.title} | ${application.appliedAt.toISOString()}`
        );
    }

    if (dryRun) {
        console.log('Dry run: no evaluations were started.');
        return;
    }

    let succeeded = 0;
    let failed = 0;

    for (const application of applications) {
        try {
            console.log(`Evaluating ${application.id}...`);
            await agentOrchestrator.evaluateApplication(application.id);
            succeeded += 1;
        } catch (error) {
            failed += 1;
            console.error(
                `Evaluation failed for ${application.id}:`,
                error instanceof Error ? error.message : error
            );
        }
    }

    console.log(
        `Re-evaluation complete: ${succeeded} succeeded, ${failed} failed.`
    );
    if (failed > 0) process.exitCode = 1;
}

main()
    .catch((error) => {
        console.error('Re-evaluation failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
