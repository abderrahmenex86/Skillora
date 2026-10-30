import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';
import {
    DeleteCompanySchema,
    ListCompaniesQuerySchema,
    RejectCompanySchema,
} from './admin.schema.js';
import { AppError } from '../../middleware/errorHandler.js';

export class AdminController {
    async listCompanies(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const query = ListCompaniesQuerySchema.parse(req.query);
            const companies = await adminService.listCompanies(query);
            res.json({ companies });
        } catch (error) {
            next(error);
        }
    }

    async getCompany(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const company = await adminService.getCompany(
                String(req.params.id)
            );
            res.json({ company });
        } catch (error) {
            next(error);
        }
    }

    async approve(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const company = await adminService.approve(
                req.user.sub,
                String(req.params.id)
            );
            res.json({ company });
        } catch (error) {
            next(error);
        }
    }

    async reject(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = RejectCompanySchema.parse(req.body);
            const company = await adminService.reject(
                req.user.sub,
                String(req.params.id),
                input
            );
            res.json({ company });
        } catch (error) {
            next(error);
        }
    }

    async freeze(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const company = await adminService.freeze(
                req.user.sub,
                String(req.params.id)
            );
            res.json({ company });
        } catch (error) {
            next(error);
        }
    }

    async unfreeze(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const company = await adminService.unfreeze(
                req.user.sub,
                String(req.params.id)
            );
            res.json({ company });
        } catch (error) {
            next(error);
        }
    }

    async archive(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const company = await adminService.archive(
                req.user.sub,
                String(req.params.id)
            );
            res.json({ company });
        } catch (error) {
            next(error);
        }
    }

    async restore(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const company = await adminService.restore(
                req.user.sub,
                String(req.params.id)
            );
            res.json({ company });
        } catch (error) {
            next(error);
        }
    }

    async softDelete(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = DeleteCompanySchema.parse(req.body);
            const company = await adminService.softDelete(
                req.user.sub,
                String(req.params.id),
                input
            );
            res.json({ company });
        } catch (error) {
            next(error);
        }
    }
}

export const adminController = new AdminController();
