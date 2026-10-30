import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { AppError } from './errorHandler.js';

declare global {
    namespace Express {
        interface Request {
            company?: {
                id: string;
                status: string;
            };
        }
    }
}

export const loadCompanyStatus = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError(401, 'Authentication required');
        }

        if (req.user.role !== 'RECRUITER') {
            next();
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.sub },
            select: {
                company: {
                    select: { id: true, status: true },
                },
            },
        });

        if (!user?.company) {
            throw new AppError(403, 'Company profile not found');
        }

        if (['ARCHIVED', 'DELETED'].includes(user.company.status)) {
            throw new AppError(
                403,
                'This company account is archived or unavailable',
                'COMPANY_UNAVAILABLE'
            );
        }

        req.company = user.company;
        next();
    } catch (error) {
        next(error);
    }
};

export const requireCompanyStatus = (...statuses: string[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.company) {
            throw new AppError(403, 'Company profile not found');
        }

        if (!statuses.includes(req.company.status)) {
            throw new AppError(
                403,
                `Company status ${req.company.status} does not allow this action`
            );
        }

        next();
    };
};

export const requireRecruiterRead = requireCompanyStatus(
    'APPROVED',
    'FROZEN'
);

export const requireApprovedCompany = requireCompanyStatus('APPROVED');
