import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string
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
        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error' });
};
