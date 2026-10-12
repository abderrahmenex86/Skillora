import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import { env } from '../../config/env.js';
import { Role, SubscriptionTier } from '@prisma/client';

export interface TokenPayload {
    sub: string;
    role: Role;
    tier: SubscriptionTier;
}

export const generateAccessToken = (payload: TokenPayload): string => {
    const options: SignOptions = {
        expiresIn: '15m',
    };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    const options: SignOptions = {
        expiresIn: '7d',
    };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

export const REFRESH_COOKIE_NAME = 'skillora_rt';

export const setRefreshTokenCookie = (res: Response, token: string): void => {
    res.cookie(REFRESH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth',
    });
};

export const clearRefreshTokenCookie = (res: Response): void => {
    res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/api/v1/auth',
    });
};
