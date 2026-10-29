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

router.get('/messages', (req, res, next) =>
    applicantController.getMessages(req, res, next)
);
router.patch('/messages/:id/read', (req, res, next) =>
    applicantController.markMessageRead(req, res, next)
);
router.post('/messages/read-all', (req, res, next) =>
    applicantController.markAllMessagesRead(req, res, next)
);
router.post('/interviews/select-range', (req, res, next) =>
    applicantController.selectInterviewRange(req, res, next)
);
router.get('/insights', (req, res, next) =>
    applicantController.getInsights(req, res, next)
);

router.post('/upgrade-pro', (req, res, next) =>
    applicantController.upgradeToPro(req, res, next)
);

router.get('/vault', (req, res, next) =>
    applicantController.getVault(req, res, next)
);

router.get('/vault/education', (req, res, next) =>
    applicantController.getVaultEducations(req, res, next)
);
router.post('/vault/education', (req, res, next) =>
    applicantController.addVaultEducation(req, res, next)
);
router.delete('/vault/education/:id', (req, res, next) =>
    applicantController.deleteVaultEducation(req, res, next)
);

router.get('/vault/projects', (req, res, next) =>
    applicantController.getVaultProjects(req, res, next)
);
router.post('/vault/projects', (req, res, next) =>
    applicantController.addVaultProject(req, res, next)
);
router.delete('/vault/projects/:id', (req, res, next) =>
    applicantController.deleteVaultProject(req, res, next)
);

router.get('/vault/experience', (req, res, next) =>
    applicantController.getVaultExperiences(req, res, next)
);
router.post('/vault/experience', (req, res, next) =>
    applicantController.addVaultExperience(req, res, next)
);
router.delete('/vault/experience/:id', (req, res, next) =>
    applicantController.deleteVaultExperience(req, res, next)
);

router.post('/vault/certifications', (req, res, next) =>
    applicantController.addVaultCertification(req, res, next)
);
router.delete('/vault/certifications/:id', (req, res, next) =>
    applicantController.deleteVaultCertification(req, res, next)
);

router.post('/vault/volunteering', (req, res, next) =>
    applicantController.addVaultVolunteering(req, res, next)
);
router.delete('/vault/volunteering/:id', (req, res, next) =>
    applicantController.deleteVaultVolunteering(req, res, next)
);

router.post('/vault/languages', (req, res, next) =>
    applicantController.addVaultLanguage(req, res, next)
);
router.delete('/vault/languages/:id', (req, res, next) =>
    applicantController.deleteVaultLanguage(req, res, next)
);

router.post('/vault/links', (req, res, next) =>
    applicantController.addVaultLink(req, res, next)
);
router.delete('/vault/links/:id', (req, res, next) =>
    applicantController.deleteVaultLink(req, res, next)
);

router.post('/vault/entries', (req, res, next) =>
    applicantController.addVaultEntry(req, res, next)
);
router.delete('/vault/entries/:id', (req, res, next) =>
    applicantController.deleteVaultEntry(req, res, next)
);

export const applicantRoutes = router;
