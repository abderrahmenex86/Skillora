import { prisma } from '../../db/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
    AddBranchInput,
    AddDepartmentInput,
    UpdateBranchInput,
    UpdateCompanyInput,
    UpdateDepartmentInput,
} from './company.schema.js';

const COMPANY_INCLUDE = {
    departments: { orderBy: { createdAt: 'asc' as const } },
    branches: { orderBy: { createdAt: 'asc' as const } },
    events: { orderBy: { createdAt: 'desc' as const }, take: 20 },
} as const;

const EDITABLE_STATUSES = new Set(['DRAFT', 'REJECTED', 'APPROVED']);

export class CompanyService {
    private async requireCompany(userId: string) {
        const company = await prisma.company.findFirst({
            where: {
                OR: [
                    { ownerId: userId },
                    { members: { some: { id: userId } } },
                ],
            },
            include: COMPANY_INCLUDE,
        });

        if (!company) {
            throw new AppError(404, 'Company profile not found');
        }

        return company;
    }

    private assertEditable(status: string) {
        if (!EDITABLE_STATUSES.has(status)) {
            throw new AppError(
                403,
                status === 'PENDING' ?
                    'Company profile is under review and cannot be edited'
                :   'Company profile is read-only'
            );
        }
    }

    async getCompany(userId: string) {
        return this.requireCompany(userId);
    }

    async updateCompany(userId: string, input: UpdateCompanyInput) {
        const company = await this.requireCompany(userId);
        this.assertEditable(company.status);

        const nextName = input.name?.trim();
        const data: Record<string, unknown> = {};

        if (nextName !== undefined) data.name = nextName;
        if (input.employeeCount !== undefined) {
            data.employeeCount = input.employeeCount;
        }
        if (input.industry !== undefined) {
            data.industry = input.industry.trim() || null;
        }
        if (input.website !== undefined) {
            data.website = input.website.trim() || null;
        }
        if (input.description !== undefined) {
            data.description = input.description.trim() || null;
        }

        await prisma.$transaction(async (tx) => {
            await tx.company.update({
                where: { id: company.id },
                data,
            });

            if (nextName && nextName !== company.name) {
                await tx.position.updateMany({
                    where: { companyId: company.id },
                    data: { companyName: nextName },
                });
            }

            await tx.companyEvent.create({
                data: {
                    companyId: company.id,
                    type: 'PROFILE_UPDATED',
                    note: 'Company profile updated.',
                },
            });
        });

        return this.getCompany(userId);
    }

    async addDepartment(userId: string, input: AddDepartmentInput) {
        const company = await this.requireCompany(userId);
        this.assertEditable(company.status);

        const name = input.name.trim();
        const existing = await prisma.companyDepartment.findFirst({
            where: { companyId: company.id, name },
        });

        if (existing) {
            throw new AppError(409, 'This department already exists');
        }

        const department = await prisma.$transaction(async (tx) => {
            const created = await tx.companyDepartment.create({
                data: { companyId: company.id, name },
            });
            await tx.companyEvent.create({
                data: {
                    companyId: company.id,
                    type: 'DEPARTMENTS_UPDATED',
                    note: `Department added: ${name}`,
                },
            });
            return created;
        });

        return department;
    }

    async updateDepartment(
        userId: string,
        departmentId: string,
        input: UpdateDepartmentInput
    ) {
        const company = await this.requireCompany(userId);
        this.assertEditable(company.status);

        const department = await prisma.companyDepartment.findFirst({
            where: { id: departmentId, companyId: company.id },
        });

        if (!department) {
            throw new AppError(404, 'Department not found');
        }

        const nextName = input.name?.trim();

        if (nextName && nextName !== department.name) {
            const duplicate = await prisma.companyDepartment.findFirst({
                where: {
                    companyId: company.id,
                    name: nextName,
                    id: { not: department.id },
                },
            });

            if (duplicate) {
                throw new AppError(409, 'This department already exists');
            }
        }

        const updated = await prisma.$transaction(async (tx) => {
            const result = await tx.companyDepartment.update({
                where: { id: department.id },
                data: {
                    ...(nextName !== undefined ? { name: nextName } : {}),
                    ...(input.isActive !== undefined ?
                        { isActive: input.isActive }
                    :   {}),
                },
            });

            if (nextName && nextName !== department.name) {
                await tx.position.updateMany({
                    where: { departmentId: department.id },
                    data: { department: nextName },
                });
            }

            await tx.companyEvent.create({
                data: {
                    companyId: company.id,
                    type: 'DEPARTMENTS_UPDATED',
                    note: `Department updated: ${result.name}`,
                },
            });

            return result;
        });

        return updated;
    }

    async addBranch(userId: string, input: AddBranchInput) {
        const company = await this.requireCompany(userId);
        this.assertEditable(company.status);

        const existing = await prisma.companyBranch.findFirst({
            where: { companyId: company.id, label: input.label.trim() },
        });

        if (existing) {
            throw new AppError(409, 'This branch already exists');
        }

        const branch = await prisma.$transaction(async (tx) => {
            const shouldBeHeadquarters =
                input.isHeadquarters === true ||
                (await tx.companyBranch.count({
                    where: { companyId: company.id, isActive: true },
                })) === 0;

            if (shouldBeHeadquarters) {
                await tx.companyBranch.updateMany({
                    where: { companyId: company.id },
                    data: { isHeadquarters: false },
                });
            }

            const created = await tx.companyBranch.create({
                data: {
                    companyId: company.id,
                    label: input.label.trim(),
                    wilaya: input.wilaya.trim(),
                    address: input.address?.trim() || null,
                    isHeadquarters: shouldBeHeadquarters,
                },
            });

            await tx.companyEvent.create({
                data: {
                    companyId: company.id,
                    type: 'BRANCHES_UPDATED',
                    note: `Branch added: ${created.label}`,
                },
            });

            return created;
        });

        return branch;
    }

    async updateBranch(
        userId: string,
        branchId: string,
        input: UpdateBranchInput
    ) {
        const company = await this.requireCompany(userId);
        this.assertEditable(company.status);

        const branch = await prisma.companyBranch.findFirst({
            where: { id: branchId, companyId: company.id },
        });

        if (!branch) {
            throw new AppError(404, 'Branch not found');
        }

        if (input.isActive === false && input.isHeadquarters === true) {
            throw new AppError(
                400,
                'The headquarters branch must stay active'
            );
        }

        const nextLabel = input.label?.trim();

        if (nextLabel && nextLabel !== branch.label) {
            const duplicate = await prisma.companyBranch.findFirst({
                where: {
                    companyId: company.id,
                    label: nextLabel,
                    id: { not: branch.id },
                },
            });

            if (duplicate) {
                throw new AppError(409, 'This branch already exists');
            }
        }

        const updated = await prisma.$transaction(async (tx) => {
            const losesHeadquarters =
                branch.isHeadquarters &&
                (input.isHeadquarters === false ||
                    input.isActive === false);

            if (losesHeadquarters) {
                const replacement = await tx.companyBranch.findFirst({
                    where: {
                        companyId: company.id,
                        id: { not: branch.id },
                        isActive: true,
                    },
                    orderBy: { createdAt: 'asc' },
                });

                if (!replacement) {
                    throw new AppError(
                        400,
                        'At least one active branch is required'
                    );
                }

                await tx.companyBranch.update({
                    where: { id: replacement.id },
                    data: { isHeadquarters: true },
                });
            }

            if (input.isHeadquarters === true) {
                await tx.companyBranch.updateMany({
                    where: { companyId: company.id },
                    data: { isHeadquarters: false },
                });
            }

            const nextWilaya = input.wilaya?.trim();
            const result = await tx.companyBranch.update({
                where: { id: branch.id },
                data: {
                    ...(nextLabel !== undefined ?
                        { label: nextLabel }
                    :   {}),
                    ...(nextWilaya !== undefined ?
                        { wilaya: nextWilaya }
                    :   {}),
                    ...(input.address !== undefined ?
                        { address: input.address.trim() || null }
                    :   {}),
                    ...(losesHeadquarters ?
                        { isHeadquarters: false }
                    : input.isHeadquarters !== undefined ?
                        { isHeadquarters: input.isHeadquarters }
                    :   {}),
                    ...(input.isActive !== undefined ?
                        { isActive: input.isActive }
                    :   {}),
                },
            });

            if (
                (nextLabel && nextLabel !== branch.label) ||
                (nextWilaya && nextWilaya !== branch.wilaya)
            ) {
                await tx.position.updateMany({
                    where: { branchId: branch.id },
                    data: {
                        location: `${result.label} · ${result.wilaya}`,
                    },
                });
            }

            await tx.companyEvent.create({
                data: {
                    companyId: company.id,
                    type: 'BRANCHES_UPDATED',
                    note: `Branch updated: ${result.label}`,
                },
            });

            return result;
        });

        return updated;
    }

    async submitCompany(userId: string) {
        const company = await this.requireCompany(userId);
        this.assertEditable(company.status);

        if (company.status !== 'DRAFT' && company.status !== 'REJECTED') {
            throw new AppError(
                400,
                'Only draft or rejected companies can be submitted for review'
            );
        }

        if (!company.employeeCount || company.employeeCount < 1) {
            throw new AppError(
                400,
                'Add your company size before submitting'
            );
        }

        const activeDepartments = company.departments.filter(
            (department) => department.isActive
        );
        const activeBranches = company.branches.filter(
            (branch) => branch.isActive
        );

        if (activeDepartments.length === 0) {
            throw new AppError(
                400,
                'Add at least one active department before submitting'
            );
        }

        if (activeBranches.length === 0) {
            throw new AppError(
                400,
                'Add at least one active branch before submitting'
            );
        }

        await prisma.$transaction(async (tx) => {
            if (!activeBranches.some((branch) => branch.isHeadquarters)) {
                await tx.companyBranch.update({
                    where: { id: activeBranches[0].id },
                    data: { isHeadquarters: true },
                });
            }

            await tx.company.update({
                where: { id: company.id },
                data: {
                    status: 'PENDING',
                    submittedAt: new Date(),
                    rejectionReason: null,
                },
            });

            await tx.companyEvent.create({
                data: {
                    companyId: company.id,
                    type: 'SUBMITTED',
                    note: 'Company profile submitted for review.',
                },
            });
        });

        return this.getCompany(userId);
    }
}

export const companyService = new CompanyService();
