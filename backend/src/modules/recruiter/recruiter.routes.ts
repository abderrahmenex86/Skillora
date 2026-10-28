import { Router } from 'express';
import { recruiterController } from './recruiter.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);
router.use(requireRole(Role.RECRUITER));

router.post('/positions', (req, res, next) =>
    recruiterController.createPosition(req, res, next)
);
router.get('/positions', (req, res, next) =>
    recruiterController.getPositions(req, res, next)
);
router.get('/positions/:id', (req, res, next) =>
    recruiterController.getPositionById(req, res, next)
);
router.patch('/positions/:id/close', (req, res, next) =>
    recruiterController.closePosition(req, res, next)
);

router.get('/positions/:id/applications', (req, res, next) =>
    recruiterController.getPositionApplications(req, res, next)
);
router.get('/applications/:id/resume', (req, res, next) =>
    recruiterController.getApplicationResume(req, res, next)
);
router.post('/applications/:id/override', (req, res, next) =>
    recruiterController.overrideDecision(req, res, next)
);

router.post('/slots', (req, res, next) =>
    recruiterController.configureSlot(req, res, next)
);

router.post('/upgrade', (req, res, next) =>
    recruiterController.upgradePlan(req, res, next)
);

export const recruiterRoutes = router;
