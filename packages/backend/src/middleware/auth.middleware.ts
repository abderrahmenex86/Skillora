import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import {
    verifyAccessToken,
    TokenPayload,
} from '../modules/auth/auth.tokens.js';
import { AppError } from './errorHandler.js';

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const requireAuth = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    } catch {
        throw new AppError(401, 'Access token expired or malformed');
    }
};

export const requireRole = (...allowedRoles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw new AppError(401, 'Authentication required');
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError(
                403,
                `Forbidden: Role ${req.user.role} does not have access to this resource`
            );
        }

        next();
    };
};
