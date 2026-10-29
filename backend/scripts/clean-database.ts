import { existsSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

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
const skipPrompt = args.includes('--yes');

async function countRows() {
    const [
        users,
        recruiters,
        applicants,
        positions,
        applications,
        resumes,
        interviews,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'RECRUITER' } }),
        prisma.user.count({ where: { role: 'APPLICANT' } }),
        prisma.position.count(),
        prisma.application.count(),
        prisma.applicantProfile.count(),
        prisma.interviewEvent.count(),
    ]);

    return { users, recruiters, applicants, positions, applications, resumes, interviews };
}

function printCounts(counts: Awaited<ReturnType<typeof countRows>>) {
    console.log('Current database contents');
    console.log('------------------------------------------------------------');
    console.log(`Users:         ${counts.users} (${counts.recruiters} recruiters, ${counts.applicants} applicants)`);
    console.log(`Positions:     ${counts.positions}`);
    console.log(`Applications:  ${counts.applications}`);
    console.log(`Resumes:       ${counts.resumes}`);
    console.log(`Interviews:    ${counts.interviews}`);
    console.log('------------------------------------------------------------');
}

async function confirmDelete(): Promise<boolean> {
    if (skipPrompt) return true;

    if (!process.stdin.isTTY) {
        console.error(
            'Refusing to delete without confirmation in a non-interactive terminal. Re-run with --yes.'
        );
        return false;
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    try {
        const answer = await rl.question(
            'This permanently deletes ALL users and dependent records.\nType DELETE to continue: '
        );
        return answer.trim() === 'DELETE';
    } finally {
        rl.close();
    }
}

async function main(): Promise<void> {
    const counts = await countRows();
    printCounts(counts);

    if (dryRun) {
        console.log('Dry run: no records were deleted.');
        return;
    }

    if (!(await confirmDelete())) {
        console.log('Cleanup cancelled. No records were deleted.');
        process.exitCode = 1;
        return;
    }

    console.log('Deleting all users and dependent records...');

    await prisma.$transaction([
        prisma.interviewEvent.deleteMany(),
        prisma.agentExecutionLog.deleteMany(),
        prisma.application.deleteMany(),
        prisma.recruiterSlot.deleteMany(),
        prisma.position.deleteMany(),
        prisma.applicantProfile.deleteMany(),
        prisma.vaultEducation.deleteMany(),
        prisma.vaultExperience.deleteMany(),
        prisma.vaultProject.deleteMany(),
        prisma.vaultCertification.deleteMany(),
        prisma.vaultVolunteering.deleteMany(),
        prisma.vaultLanguage.deleteMany(),
        prisma.vaultLink.deleteMany(),
        prisma.vaultEntry.deleteMany(),
        prisma.refreshToken.deleteMany(),
        prisma.user.deleteMany(),
    ]);

    const [users, positions, applications] = await Promise.all([
        prisma.user.count(),
        prisma.position.count(),
        prisma.application.count(),
    ]);

    if (users !== 0 || positions !== 0 || applications !== 0) {
        throw new Error(
            `Cleanup incomplete: ${users} users, ${positions} positions, ${applications} applications remain`
        );
    }

    console.log('Cleanup complete: all users, positions, applications, and dependent records were deleted.');
}

main()
    .catch((error) => {
        console.error('Database cleanup failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
