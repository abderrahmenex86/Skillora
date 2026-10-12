import { Router } from 'express';
import { applicantController } from './applicant.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);
router.use(requireRole(Role.APPLICANT));

router.get('/profiles', (req, res, next) =>
    applicantController.getProfiles(req, res, next)
);
router.post('/profiles', (req, res, next) =>
    applicantController.createProfile(req, res, next)
);
router.put('/profiles/:id', (req, res, next) =>
    applicantController.updateProfile(req, res, next)
);
router.delete('/profiles/:id', (req, res, next) =>
    applicantController.deleteProfile(req, res, next)
);

router.post('/applications', (req, res, next) =>
    applicantController.submitApplication(req, res, next)
);
router.get('/applications', (req, res, next) =>
    applicantController.getMyApplications(req, res, next)
);

router.get('/calendar', (req, res, next) =>
    applicantController.getCalendarEvents(req, res, next)
);
router.post('/interviews/select-range', (req, res, next) =>
    applicantController.selectInterviewRange(req, res, next)
);
router.get('/insights', (req, res, next) =>
    applicantController.getInsights(req, res, next)
);

export const applicantRoutes = router;
