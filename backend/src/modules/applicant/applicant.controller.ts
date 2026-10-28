import { Request, Response, NextFunction } from 'express';
import { applicantService } from './applicant.service.js';
import {
    CreateProfileSchema,
    UpdateProfileSchema,
    SubmitApplicationSchema,
    AddEducationSchema,
    AddExperienceSchema,
    AddProjectSchema,
    AddCertificationSchema,
    AddVolunteeringSchema,
    AddLanguageSchema,
    AddLinkSchema,
    UpgradePlanSchema,
    AddVaultEntrySchema,
} from './applicant.schema.js';
import { AppError } from '../../middleware/errorHandler.js';
import { SelectInterviewRangeSchema } from './applicant.schema.js';
import { applicantServiceExtensions } from './applicant.service.js';

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
                String(req.params.id),
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
                String(req.params.id)
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
    async getVault(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const vault = await applicantService.getVault(req.user.sub);
            res.json({ vault });
        } catch (err) {
            next(err);
        }
    }

    async getVaultEducations(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const education = await applicantService.getVaultEducations(
                req.user.sub
            );
            res.json({ education });
        } catch (err) {
            next(err);
        }
    }

    async addVaultEducation(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = AddEducationSchema.parse(req.body);
            const education = await applicantService.addVaultEducation(
                req.user.sub,
                input
            );
            res.status(201).json({ education });
        } catch (err) {
            next(err);
        }
    }

    async deleteVaultEducation(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const result = await applicantService.deleteVaultEducation(
                req.user.sub,
                String(req.params.id)
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getVaultProjects(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const projects = await applicantService.getVaultProjects(
                req.user.sub
            );
            res.json({ projects });
        } catch (err) {
            next(err);
        }
    }

    async addVaultProject(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = AddProjectSchema.parse(req.body);
            const project = await applicantService.addVaultProject(
                req.user.sub,
                input
            );
            res.status(201).json({ project });
        } catch (err) {
            next(err);
        }
    }

    async deleteVaultProject(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const result = await applicantService.deleteVaultProject(
                req.user.sub,
                String(req.params.id)
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getVaultExperiences(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const experience = await applicantService.getVaultExperiences(
                req.user.sub
            );
            res.json({ experience });
        } catch (err) {
            next(err);
        }
    }

    async addVaultExperience(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = AddExperienceSchema.parse(req.body);
            const experience = await applicantService.addVaultExperience(
                req.user.sub,
                input
            );
            res.status(201).json({ experience });
        } catch (err) {
            next(err);
        }
    }

    async deleteVaultExperience(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const result = await applicantService.deleteVaultExperience(
                req.user.sub,
                String(req.params.id)
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async addVaultCertification(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = AddCertificationSchema.parse(req.body);
            const certification = await applicantService.addVaultCertification(
                req.user.sub,
                input
            );
            res.status(201).json({ certification });
        } catch (err) {
            next(err);
        }
    }

    async deleteVaultCertification(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const result = await applicantService.deleteVaultCertification(
                req.user.sub,
                String(req.params.id)
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async addVaultVolunteering(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = AddVolunteeringSchema.parse(req.body);
            const volunteering = await applicantService.addVaultVolunteering(
                req.user.sub,
                input
            );
            res.status(201).json({ volunteering });
        } catch (err) {
            next(err);
        }
    }

    async deleteVaultVolunteering(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const result = await applicantService.deleteVaultVolunteering(
                req.user.sub,
                String(req.params.id)
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async addVaultLanguage(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = AddLanguageSchema.parse(req.body);
            const language = await applicantService.addVaultLanguage(
                req.user.sub,
                input
            );
            res.status(201).json({ language });
        } catch (err) {
            next(err);
        }
    }

    async deleteVaultLanguage(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const result = await applicantService.deleteVaultLanguage(
                req.user.sub,
                String(req.params.id)
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async addVaultLink(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = AddLinkSchema.parse(req.body);
            const link = await applicantService.addVaultLink(
                req.user.sub,
                input
            );
            res.status(201).json({ link });
        } catch (err) {
            next(err);
        }
    }

    async deleteVaultLink(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const result = await applicantService.deleteVaultLink(
                req.user.sub,
                String(req.params.id)
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async addVaultEntry(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = AddVaultEntrySchema.parse(req.body);
            const entry = await applicantService.addVaultEntry(
                req.user.sub,
                input
            );
            res.status(201).json({ entry });
        } catch (err) {
            next(err);
        }
    }

    async deleteVaultEntry(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const result = await applicantService.deleteVaultEntry(
                req.user.sub,
                String(req.params.id)
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getCalendarEvents(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const events = await applicantServiceExtensions.getCalendarEvents(
                req.user.sub
            );
            res.json({ events });
        } catch (err) {
            next(err);
        }
    }

    async selectInterviewRange(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const input = SelectInterviewRangeSchema.parse(req.body);
            const updated =
                await applicantServiceExtensions.selectInterviewRange(
                    req.user.sub,
                    input.interviewEventId,
                    input.selectedStart,
                    input.selectedEnd
                );
            res.json({ interviewEvent: updated });
        } catch (err) {
            next(err);
        }
    }

    async getInsights(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const insights = await applicantServiceExtensions.getProInsights(
                req.user.sub
            );
            res.json({ insights });
        } catch (err) {
            next(err);
        }
    }
    async upgradeToPro(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new AppError(401, 'Unauthorized');
            const { months } = UpgradePlanSchema.parse(req.body);
            const user = await applicantService.upgradeToPro(
                req.user.sub,
                months
            );
            res.json({
                user,
                message: `Candidate ${months}-month pack activated successfully`,
            });
        } catch (err) {
            next(err);
        }
    }
}

export const applicantController = new ApplicantController();
