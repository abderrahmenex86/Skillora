import { Request, Response, NextFunction } from 'express';
import { companyService } from './company.service.js';
import {
    AddBranchSchema,
    AddDepartmentSchema,
    UpdateBranchSchema,
    UpdateCompanySchema,
    UpdateDepartmentSchema,
} from './company.schema.js';
import { AppError } from '../../middleware/errorHandler.js';

export class CompanyController {
    async getCompany(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const company = await companyService.getCompany(req.user.sub);
            res.json({ company });
        } catch (error) {
            next(error);
        }
    }

    async updateCompany(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = UpdateCompanySchema.parse(req.body);
            const company = await companyService.updateCompany(
                req.user.sub,
                input
            );
            res.json({ company });
        } catch (error) {
            next(error);
        }
    }

    async addDepartment(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = AddDepartmentSchema.parse(req.body);
            const department = await companyService.addDepartment(
                req.user.sub,
                input
            );
            res.status(201).json({ department });
        } catch (error) {
            next(error);
        }
    }

    async updateDepartment(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = UpdateDepartmentSchema.parse(req.body);
            const department = await companyService.updateDepartment(
                req.user.sub,
                String(req.params.id),
                input
            );
            res.json({ department });
        } catch (error) {
            next(error);
        }
    }

    async addBranch(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = AddBranchSchema.parse(req.body);
            const branch = await companyService.addBranch(
                req.user.sub,
                input
            );
            res.status(201).json({ branch });
        } catch (error) {
            next(error);
        }
    }

    async updateBranch(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = UpdateBranchSchema.parse(req.body);
            const branch = await companyService.updateBranch(
                req.user.sub,
                String(req.params.id),
                input
            );
            res.json({ branch });
        } catch (error) {
            next(error);
        }
    }

    async submitCompany(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const company = await companyService.submitCompany(req.user.sub);
            res.json({ company });
        } catch (error) {
            next(error);
        }
    }
}

export const companyController = new CompanyController();
