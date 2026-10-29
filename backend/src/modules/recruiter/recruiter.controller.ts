import { Request, Response, NextFunction } from 'express';
import { recruiterService } from './recruiter.service.js';
import {
    CreatePositionSchema,
    OverrideDecisionSchema,
    ConfigureSlotSchema,
    ExtendDeadlineSchema,
    UpgradeCompanyPlanSchema,
} from './recruiter.schema.js';
import { AppError } from '../../middleware/errorHandler.js';

export class RecruiterController {
    async createPosition(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = CreatePositionSchema.parse(req.body);
            const position = await recruiterService.createPosition(
                req.user.sub,
                input
            );
            res.status(201).json({ position });
        } catch (err) {
            next(err);
        }
    }

    async getPositions(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const positions = await recruiterService.getPositions(req.user.sub);
            res.json({ positions });
        } catch (err) {
            next(err);
        }
    }

    async getPositionById(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const position = await recruiterService.getPositionById(
                req.user.sub,
                String(req.params.id)
            );
            res.json({ position });
        } catch (err) {
            next(err);
        }
    }

    async getPositionApplications(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const applications = await recruiterService.getPositionApplications(
                req.user.sub,
                String(req.params.id)
            );
            res.json({ applications });
        } catch (err) {
            next(err);
        }
    }

    async getApplicationResume(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const resume = await recruiterService.getApplicationResume(
                req.user.sub,
                String(req.params.id)
            );
            res.json({ resume });
        } catch (err) {
            next(err);
        }
    }

    async overrideDecision(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = OverrideDecisionSchema.parse(req.body);
            const updated = await recruiterService.overrideDecision(
                req.user.sub,
                String(req.params.id),
                input
            );
            res.json({ application: updated });
        } catch (err) {
            next(err);
        }
    }

    async extendDeadline(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = ExtendDeadlineSchema.parse(req.body);
            const position = await recruiterService.extendDeadline(
                req.user.sub,
                String(req.params.id),
                input
            );
            res.json({ position });
        } catch (err) {
            next(err);
        }
    }

    async closePosition(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const position = await recruiterService.closePosition(
                req.user.sub,
                String(req.params.id)
            );
            res.json({ position });
        } catch (err) {
            next(err);
        }
    }

    async configureSlot(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = ConfigureSlotSchema.parse(req.body);
            const slot = await recruiterService.configureSlot(
                req.user.sub,
                input
            );
            res.status(201).json({ slot });
        } catch (err) {
            next(err);
        }
    }

    async upgradePlan(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const { months } = UpgradeCompanyPlanSchema.parse(req.body);
            const user = await recruiterService.upgradePlan(
                req.user.sub,
                months
            );
            res.json({
                user,
                message: `Company ${
                    months === 12 ? 'annual' : 'monthly'
                } plan activated successfully`,
            });
        } catch (err) {
            next(err);
        }
    }
}

export const recruiterController = new RecruiterController();
