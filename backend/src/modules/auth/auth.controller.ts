import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import {
    RegisterSchema,
    LoginSchema,
    UpdateProfileSchema,
    UpdatePasswordSchema,
} from './auth.schema.js';
import {
    setRefreshTokenCookie,
    clearRefreshTokenCookie,
    REFRESH_COOKIE_NAME,
} from './auth.tokens.js';
import { AppError } from '../../middleware/errorHandler.js';

export class AuthController {
    async register(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input = RegisterSchema.parse(req.body);
            const { user, accessToken, refreshToken } =
                await authService.register(input);

            setRefreshTokenCookie(res, refreshToken);

            res.status(201).json({
                user,
                accessToken,
            });
        } catch (error) {
            next(error);
        }
    }

    async login(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input = LoginSchema.parse(req.body);
            const { user, accessToken, refreshToken } =
                await authService.login(input);

            setRefreshTokenCookie(res, refreshToken);

            res.status(200).json({
                user,
                accessToken,
            });
        } catch (error) {
            next(error);
        }
    }

    async refresh(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const incomingRefreshToken = req.cookies[REFRESH_COOKIE_NAME];

            if (!incomingRefreshToken) {
                throw new AppError(401, 'No refresh token provided in cookie');
            }

            const { user, accessToken, refreshToken } =
                await authService.refreshTokens(incomingRefreshToken);

            setRefreshTokenCookie(res, refreshToken);

            res.status(200).json({
                user,
                accessToken,
            });
        } catch (error) {
            clearRefreshTokenCookie(res);
            next(error);
        }
    }

    async logout(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const incomingRefreshToken = req.cookies[REFRESH_COOKIE_NAME];
            await authService.logout(incomingRefreshToken);

            clearRefreshTokenCookie(res);

            res.status(200).json({ message: 'Logged out successfully' });
        } catch (error) {
            next(error);
        }
    }

    async me(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, 'Unauthorized');
            }

            const user = await authService.getMe(req.user.sub);
            res.status(200).json({ user });
        } catch (error) {
            next(error);
        }
    }

    async updateMe(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, 'Unauthorized');
            }

            const input = UpdateProfileSchema.parse(req.body);
            const user = await authService.updateProfile(req.user.sub, input);
            res.status(200).json({ user });
        } catch (error) {
            next(error);
        }
    }

    async updatePassword(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, 'Unauthorized');
            }

            const input = UpdatePasswordSchema.parse(req.body);
            const result = await authService.updatePassword(
                req.user.sub,
                input
            );
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();
