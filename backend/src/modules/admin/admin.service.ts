import { prisma } from '../../db/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CompanyStatus, CompanyEventType } from '@prisma/client';
import {
    DeleteCompanyInput,
    ListCompaniesQuery,
    RejectCompanyInput,
} from './admin.schema.js';

const COMPANY_DETAIL_INCLUDE = {
    owner: {
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
        },
    },
    departments: { orderBy: { createdAt: 'asc' as const } },
    branches: { orderBy: { createdAt: 'asc' as const } },
    positions: {
        orderBy: { createdAt: 'desc' as const },
        select: {
            id: true,
            title: true,
            status: true,
            deadline: true,
            _count: { select: { applications: true } },
        },
    },
    events: {
        orderBy: { createdAt: 'desc' as const },
        take: 50,
        include: {
            admin: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    },
} as const;

export class AdminService {
    async listCompanies(query: ListCompaniesQuery) {
        return prisma.company.findMany({
            where: {
                ...(query.status ? { status: query.status } : {}),
                ...(query.search ?
                    {
                        name: {
                            contains: query.search,
                            mode: 'insensitive' as const,
                        },
                    }
                :   {}),
            },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        positions: true,
                        members: true,
                    },
                },
            },
        });
    }

    async getCompany(id: string) {
        const company = await prisma.company.findUnique({
            where: { id },
            include: COMPANY_DETAIL_INCLUDE,
        });

        if (!company) {
            throw new AppError(404, 'Company not found');
        }

        return company;
    }

    private assertStatus(
        company: { status: CompanyStatus },
        allowed: CompanyStatus[],
        action: string
    ) {
        if (!allowed.includes(company.status)) {
            throw new AppError(
                400,
                `Cannot ${action} a company with status ${company.status}`
            );
        }
    }

    private async transition(
        adminId: string,
        companyId: string,
        from: CompanyStatus[],
        to: CompanyStatus,
        eventType: CompanyEventType,
        note: string,
        options: {
            rejectionReason?: string | null;
            revokeSessions?: boolean;
        } = {}
    ) {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { id: true, status: true },
        });

        if (!company) throw new AppError(404, 'Company not found');
        this.assertStatus(
            company,
            from,
            eventType.toLowerCase().replaceAll('_', ' ')
        );

        await prisma.$transaction(async (tx) => {
            await tx.company.update({
                where: { id: companyId },
                data: {
                    status: to,
                    ...(to === 'APPROVED' || to === 'REJECTED' ?
                        { reviewedAt: new Date(), reviewedById: adminId }
                    :   {}),
                    ...(options.rejectionReason !== undefined ?
                        { rejectionReason: options.rejectionReason }
                    :   {}),
                },
            });

            await tx.companyEvent.create({
                data: {
                    companyId,
                    adminId,
                    type: eventType,
                    note,
                },
            });

            if (options.revokeSessions) {
                await tx.refreshToken.deleteMany({
                    where: { user: { companyId } },
                });
            }
        });

        return this.getCompany(companyId);
    }

    async approve(adminId: string, companyId: string) {
        return this.transition(
            adminId,
            companyId,
            ['PENDING'],
            'APPROVED',
            'APPROVED',
            'Company profile approved.'
        );
    }

    async reject(
        adminId: string,
        companyId: string,
        input: RejectCompanyInput
    ) {
        return this.transition(
            adminId,
            companyId,
            ['PENDING'],
            'REJECTED',
            'REJECTED',
            input.reason,
            { rejectionReason: input.reason }
        );
    }

    async freeze(adminId: string, companyId: string) {
        return this.transition(
            adminId,
            companyId,
            ['APPROVED'],
            'FROZEN',
            'FROZEN',
            'Company frozen; recruiter workspace is read-only.'
        );
    }

    async unfreeze(adminId: string, companyId: string) {
        return this.transition(
            adminId,
            companyId,
            ['FROZEN'],
            'APPROVED',
            'UNFROZEN',
            'Company unfrozen.'
        );
    }

    async archive(adminId: string, companyId: string) {
        return this.transition(
            adminId,
            companyId,
            ['APPROVED', 'FROZEN'],
            'ARCHIVED',
            'ARCHIVED',
            'Company archived; recruiter access and public jobs are disabled.',
            { revokeSessions: true }
        );
    }

    async restore(adminId: string, companyId: string) {
        return this.transition(
            adminId,
            companyId,
            ['ARCHIVED'],
            'APPROVED',
            'RESTORED',
            'Company restored to approved.'
        );
    }

    async softDelete(
        adminId: string,
        companyId: string,
        input: DeleteCompanyInput
    ) {
        return this.transition(
            adminId,
            companyId,
            [
                'DRAFT',
                'PENDING',
                'APPROVED',
                'REJECTED',
                'FROZEN',
                'ARCHIVED',
            ],
            'DELETED',
            'DELETED',
            input.reason,
            { revokeSessions: true }
        );
    }
}

export const adminService = new AdminService();
