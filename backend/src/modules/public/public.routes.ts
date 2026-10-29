import { Router } from 'express';
import { prisma } from '../../db/prisma.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();

router.get('/positions', requireAuth, async (_req, res, next) => {
    try {
        const now = new Date();
        const positions = await prisma.position.findMany({
            where: {
                status: 'OPEN',
                deadline: { gt: now },
            },
            orderBy: { deadline: 'asc' },
            select: {
                id: true,
                companyName: true,
                title: true,
                department: true,
                location: true,
                deadline: true,
                interviewCapacity: true,
                interviewRangeStart: true,
                interviewRangeEnd: true,
                rubric: true,
                createdAt: true,
            },
        });

        res.json({ positions });
    } catch (err) {
        next(err);
    }
});

router.get('/positions/:id', requireAuth, async (req, res, next) => {
    try {
        const position = await prisma.position.findUnique({
            where: { id: String(req.params.id) },
            select: {
                id: true,
                companyName: true,
                title: true,
                department: true,
                location: true,
                deadline: true,
                status: true,
                interviewCapacity: true,
                interviewRangeStart: true,
                interviewRangeEnd: true,
                rubric: true,
                createdAt: true,
            },
        });

        if (!position) {
            throw new AppError(404, 'Position not found');
        }

        res.json({ position });
    } catch (err) {
        next(err);
    }
});

export const publicRoutes = router;
