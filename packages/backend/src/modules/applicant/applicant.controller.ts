import { Request, Response, NextFunction } from 'express';
import { applicantService } from './applicant.service.js';
import {
    CreateProfileSchema,
    UpdateProfileSchema,
    SubmitApplicationSchema,
} from './applicant.schema.js';
import { AppError } from '../../middleware/errorHandler.js';

export class ApplicantController {
    async getProfiles(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const profiles = await applicantService.getProfiles(req.user.sub);
            res.json({ profiles });
        } catch (err) {
            next(err);
        }
    }

    async createProfile(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = CreateProfileSchema.parse(req.body);
            const profile = await applicantService.createProfile(
                req.user.sub,
                input
            );
            res.status(201).json({ profile });
        } catch (err) {
            next(err);
        }
    }

    async updateProfile(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = UpdateProfileSchema.parse(req.body);
            const profile = await applicantService.updateProfile(
                req.user.sub,
                req.params.id,
                input
            );
            res.json({ profile });
        } catch (err) {
            next(err);
        }
    }

    async deleteProfile(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const result = await applicantService.deleteProfile(
                req.user.sub,
                req.params.id
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async submitApplication(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = SubmitApplicationSchema.parse(req.body);
            const application = await applicantService.submitApplication(
                req.user.sub,
                input
            );
            res.status(201).json({ application });
        } catch (err) {
            next(err);
        }
    }

    async getMyApplications(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const applications = await applicantService.getMyApplications(
                req.user.sub
            );
            res.json({ applications });
        } catch (err) {
            next(err);
        }
    }
}

export const applicantController = new ApplicantController();
