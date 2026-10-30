import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

function wilayaForLocation(location: string): string {
    const normalized = location.toLowerCase();
    if (normalized.includes('algiers') || normalized.includes('alger')) {
        return '16 - Alger';
    }
    if (normalized.includes('oran')) return '31 - Oran';
    if (normalized.includes('constantine')) return '25 - Constantine';
    if (normalized.includes('setif') || normalized.includes('sétif')) {
        return '19 - Sétif';
    }
    if (normalized.includes("m'sila") || normalized.includes('msila')) {
        return "28 - M'Sila";
    }
    return '16 - Alger';
}

function unique<T>(items: T[]): T[] {
    return [...new Set(items)];
}

async function main() {
    const recruiters = await prisma.user.findMany({
        where: {
            role: 'RECRUITER',
            companyId: null,
        },
        select: {
            id: true,
            email: true,
            companyName: true,
            positions: {
                select: {
                    id: true,
                    companyName: true,
                    department: true,
                    location: true,
                    description: true,
                },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    if (recruiters.length === 0) {
        console.log('No recruiters need company backfill.');
        return;
    }

    console.log(
        `${dryRun ? '[dry-run] ' : ''}Backfilling ${recruiters.length} recruiter(s).`
    );

    for (const recruiter of recruiters) {
        const companyName =
            recruiter.companyName?.trim() ||
            recruiter.positions[0]?.companyName?.trim() ||
            'Unassigned Company';
        const departments = unique(
            recruiter.positions
                .map((position) => position.department.trim())
                .filter(Boolean)
        );
        const branches = unique(
            recruiter.positions
                .map((position) => position.location.trim())
                .filter(Boolean)
        );

        console.log(
            `- ${recruiter.email}: ${companyName} (${departments.length} departments, ${branches.length} branches, ${recruiter.positions.length} positions)`
        );

        if (dryRun) continue;

        await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name: companyName,
                    employeeCount: 1,
                    status: 'APPROVED',
                    ownerId: recruiter.id,
                    submittedAt: new Date(),
                    reviewedAt: new Date(),
                    events: {
                        create: {
                            type: 'PROFILE_UPDATED',
                            note: 'Backfilled from legacy data.',
                        },
                    },
                },
            });

            await tx.user.update({
                where: { id: recruiter.id },
                data: { companyId: company.id },
            });

            const departmentIds = new Map<string, string>();
            for (const name of departments) {
                const department = await tx.companyDepartment.create({
                    data: { companyId: company.id, name },
                });
                departmentIds.set(name, department.id);
            }

            const branchIds = new Map<string, string>();
            for (const label of branches) {
                const branch = await tx.companyBranch.create({
                    data: {
                        companyId: company.id,
                        label,
                        wilaya: wilayaForLocation(label),
                        isHeadquarters: branchIds.size === 0,
                    },
                });
                branchIds.set(label, branch.id);
            }

            for (const position of recruiter.positions) {
                await tx.position.update({
                    where: { id: position.id },
                    data: {
                        companyId: company.id,
                        departmentId:
                            departmentIds.get(position.department.trim()) ??
                            null,
                        branchId:
                            branchIds.get(position.location.trim()) ?? null,
                        description:
                            position.description ??
                            'Requirements are defined by the mandatory rubric for this role.',
                    },
                });
            }
        });

        console.log(`  linked ${recruiter.email}`);
    }

    console.log(
        dryRun ?
            'Dry run complete: no database changes were made.'
        :   'Backfill complete.'
    );
}

main()
    .catch((error) => {
        console.error('Company backfill failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
