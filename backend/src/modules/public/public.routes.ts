import { Router } from 'express';
import { AppError } from '../../middleware/errorHandler.js';
import { getPublicPosition, listPublicPositions } from './public.service.js';

const router = Router();

router.get('/positions', async (_req, res, next) => {
    try {
        const positions = await listPublicPositions();
        res.json({ positions });
    } catch (error) {
        next(error);
    }
});

router.get('/positions/:id', async (req, res, next) => {
    try {
        const position = await getPublicPosition(String(req.params.id));

        if (!position) {
            throw new AppError(404, 'Position not found');
        }

        res.json({ position });
    } catch (error) {
        next(error);
    }
});

export const publicRoutes = router;
