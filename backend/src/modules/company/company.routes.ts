import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { loadCompanyStatus } from '../../middleware/company.middleware.js';
import { companyController } from './company.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(Role.RECRUITER));
router.use(loadCompanyStatus);

router.get('/', (req, res, next) =>
    companyController.getCompany(req, res, next)
);
router.patch('/', (req, res, next) =>
    companyController.updateCompany(req, res, next)
);
router.post('/departments', (req, res, next) =>
    companyController.addDepartment(req, res, next)
);
router.patch('/departments/:id', (req, res, next) =>
    companyController.updateDepartment(req, res, next)
);
router.post('/branches', (req, res, next) =>
    companyController.addBranch(req, res, next)
);
router.patch('/branches/:id', (req, res, next) =>
    companyController.updateBranch(req, res, next)
);
router.post('/submit', (req, res, next) =>
    companyController.submitCompany(req, res, next)
);

export const companyRoutes = router;
