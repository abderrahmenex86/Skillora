import { Router } from 'express';
import { authController } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/register', (req, res, next) =>
    authController.register(req, res, next)
);
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) =>
    authController.refresh(req, res, next)
);
router.post('/logout', (req, res, next) =>
    authController.logout(req, res, next)
);
router.get('/me', requireAuth, (req, res, next) =>
    authController.me(req, res, next)
);
router.patch('/me', requireAuth, (req, res, next) =>
    authController.updateMe(req, res, next)
);
router.patch('/me/password', requireAuth, (req, res, next) =>
    authController.updatePassword(req, res, next)
);

export const authRoutes = router;
