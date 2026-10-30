import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code?: string
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (err instanceof ZodError) {
        res.status(400).json({
            error: 'Validation failed',
            issues: err.errors.map((e) => ({
                path: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
            ...(err.code ? { code: err.code } : {}),
        });
        return;
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            res.status(409).json({
                error: 'A record with this value already exists',
                code: 'CONFLICT',
            });
            return;
        }

        if (err.code === 'P2003') {
            res.status(400).json({
                error: 'A related record could not be found',
                code: 'INVALID_REFERENCE',
            });
            return;
        }

        if (err.code === 'P2023') {
            res.status(400).json({
                error: 'Invalid identifier',
                code: 'INVALID_IDENTIFIER',
            });
            return;
        }

        if (err.code === 'P2025') {
            res.status(404).json({
                error: 'Record not found',
                code: 'NOT_FOUND',
            });
            return;
        }
    }

    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error' });
};
