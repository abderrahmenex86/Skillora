import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { adminController } from './admin.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(Role.ADMIN));

router.get('/companies', (req, res, next) =>
    adminController.listCompanies(req, res, next)
);
router.get('/companies/:id', (req, res, next) =>
    adminController.getCompany(req, res, next)
);
router.post('/companies/:id/approve', (req, res, next) =>
    adminController.approve(req, res, next)
);
router.post('/companies/:id/reject', (req, res, next) =>
    adminController.reject(req, res, next)
);
router.post('/companies/:id/freeze', (req, res, next) =>
    adminController.freeze(req, res, next)
);
router.post('/companies/:id/unfreeze', (req, res, next) =>
    adminController.unfreeze(req, res, next)
);
router.post('/companies/:id/archive', (req, res, next) =>
    adminController.archive(req, res, next)
);
router.post('/companies/:id/restore', (req, res, next) =>
    adminController.restore(req, res, next)
);
router.delete('/companies/:id', (req, res, next) =>
    adminController.softDelete(req, res, next)
);

export const adminRoutes = router;
