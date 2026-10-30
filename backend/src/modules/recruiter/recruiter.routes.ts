import { Router } from 'express';
import { recruiterController } from './recruiter.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
    loadCompanyStatus,
    requireApprovedCompany,
    requireRecruiterRead,
} from '../../middleware/company.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);
router.use(requireRole(Role.RECRUITER));
router.use(loadCompanyStatus);

router.post(
    '/positions',
    requireApprovedCompany,
    (req, res, next) =>
        recruiterController.createPosition(req, res, next)
);
router.get(
    '/positions',
    requireRecruiterRead,
    (req, res, next) => recruiterController.getPositions(req, res, next)
);
router.get(
    '/positions/:id',
    requireRecruiterRead,
    (req, res, next) =>
        recruiterController.getPositionById(req, res, next)
);
router.patch(
    '/positions/:id/close',
    requireApprovedCompany,
    (req, res, next) => recruiterController.closePosition(req, res, next)
);

router.patch(
    '/positions/:id/deadline',
    requireApprovedCompany,
    (req, res, next) =>
        recruiterController.extendDeadline(req, res, next)
);

router.get(
    '/positions/:id/applications',
    requireRecruiterRead,
    (req, res, next) =>
        recruiterController.getPositionApplications(req, res, next)
);
router.get(
    '/applications/:id/resume',
    requireRecruiterRead,
    (req, res, next) =>
        recruiterController.getApplicationResume(req, res, next)
);
router.post(
    '/applications/:id/override',
    requireApprovedCompany,
    (req, res, next) =>
        recruiterController.overrideDecision(req, res, next)
);

router.post(
    '/slots',
    requireApprovedCompany,
    (req, res, next) => recruiterController.configureSlot(req, res, next)
);

router.post(
    '/upgrade',
    requireApprovedCompany,
    (req, res, next) => recruiterController.upgradePlan(req, res, next)
);

export const recruiterRoutes = router;
