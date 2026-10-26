import bcrypt from 'bcryptjs';
import { prisma } from '../../db/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
    RegisterInput,
    LoginInput,
    UpdateProfileInput,
} from './auth.schema.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    TokenPayload,
} from './auth.tokens.js';

export class AuthService {
    async register(input: RegisterInput) {
        const existing = await prisma.user.findUnique({
            where: { email: input.email.toLowerCase().trim() },
        });

        if (existing) {
            throw new AppError(
                409,
                'An account with this email already exists'
            );
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(input.password, salt);

        const user = await prisma.user.create({
            data: {
                email: input.email.toLowerCase().trim(),
                passwordHash,
                firstName: input.firstName.trim(),
                middleName: input.middleName?.trim() || null,
                lastName: input.lastName.trim(),
                phone: input.phone?.trim() || null,
                wilaya: input.wilaya || '16 - Algiers',
                companyName: input.companyName?.trim() || null,
                role: input.role,
                subscriptionTier: 'FREE',
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                middleName: true,
                lastName: true,
                phone: true,
                wilaya: true,
                companyName: true,
                role: true,
                subscriptionTier: true,
                createdAt: true,
            },
        });

        const tokenPayload: TokenPayload = {
            sub: user.id,
            role: user.role,
            tier: user.subscriptionTier,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            },
        });

        return { user, accessToken, refreshToken };
    }

    async login(input: LoginInput) {
        const user = await prisma.user.findUnique({
            where: { email: input.email.toLowerCase().trim() },
        });

        if (!user) {
            throw new AppError(401, 'Invalid email or password');
        }

        const isMatch = await bcrypt.compare(input.password, user.passwordHash);
        if (!isMatch) {
            throw new AppError(401, 'Invalid email or password');
        }

        const tokenPayload: TokenPayload = {
            sub: user.id,
            role: user.role,
            tier: user.subscriptionTier,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            },
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                phone: user.phone,
                wilaya: user.wilaya,
                companyName: user.companyName,
                role: user.role,
                subscriptionTier: user.subscriptionTier,
                createdAt: user.createdAt,
            },
            accessToken,
            refreshToken,
        };
    }

    async refreshTokens(incomingRefreshToken: string) {
        let payload: TokenPayload;
        try {
            payload = verifyRefreshToken(incomingRefreshToken);
        } catch {
            throw new AppError(401, 'Invalid or expired refresh token');
        }

        const savedToken = await prisma.refreshToken.findUnique({
            where: { token: incomingRefreshToken },
            include: { user: true },
        });

        if (!savedToken) {
            await prisma.refreshToken.deleteMany({
                where: { userId: payload.sub },
            });
            throw new AppError(
                401,
                'Refresh token reuse detected. Access revoked.'
            );
        }

        if (savedToken.expiresAt < new Date()) {
            await prisma.refreshToken.delete({ where: { id: savedToken.id } });
            throw new AppError(401, 'Refresh token has expired');
        }

        await prisma.refreshToken.delete({ where: { id: savedToken.id } });

        const newPayload: TokenPayload = {
            sub: savedToken.user.id,
            role: savedToken.user.role,
            tier: savedToken.user.subscriptionTier,
        };

        const newAccessToken = generateAccessToken(newPayload);
        const newRefreshToken = generateRefreshToken(newPayload);

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: savedToken.user.id,
                expiresAt,
            },
        });

        return {
            user: {
                id: savedToken.user.id,
                email: savedToken.user.email,
                firstName: savedToken.user.firstName,
                middleName: savedToken.user.middleName,
                lastName: savedToken.user.lastName,
                phone: savedToken.user.phone,
                wilaya: savedToken.user.wilaya,
                companyName: savedToken.user.companyName,
                role: savedToken.user.role,
                subscriptionTier: savedToken.user.subscriptionTier,
                createdAt: savedToken.user.createdAt,
            },
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }

    async logout(refreshToken?: string) {
        if (refreshToken) {
            await prisma.refreshToken.deleteMany({
                where: { token: refreshToken },
            });
        }
    }

    async getMe(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                middleName: true,
                lastName: true,
                phone: true,
                wilaya: true,
                companyName: true,
                role: true,
                subscriptionTier: true,
                subscriptionExpiresAt: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new AppError(404, 'User not found');
        }

        return user;
    }

    async updateProfile(userId: string, input: UpdateProfileInput) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                firstName: input.firstName.trim(),
                middleName: input.middleName?.trim() || null,
                lastName: input.lastName.trim(),
                phone: input.phone?.trim() || null,
                wilaya: input.wilaya || null,
                companyName: input.companyName?.trim() || null,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                middleName: true,
                lastName: true,
                phone: true,
                wilaya: true,
                companyName: true,
                role: true,
                subscriptionTier: true,
                createdAt: true,
            },
        });
    }
}

export const authService = new AuthService();
