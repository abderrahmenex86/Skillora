import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'crypto';
import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
    RegisterInput,
    LoginInput,
    UpdateProfileInput,
    UpdatePasswordInput,
} from './auth.schema.js';
import {
    generateAccessToken,
    generateRefreshToken,
    generatePasswordResetToken,
    verifyPasswordResetToken,
    passwordFingerprint,
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

    async requestPasswordReset(email: string) {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { id: true, email: true, passwordHash: true },
        });

        if (!user) {
            return { resetUrl: null };
        }

        const token = generatePasswordResetToken(user.id, user.passwordHash);
        const resetUrl = `${env.CLIENT_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;

        if (env.NODE_ENV === 'production') {
            console.warn(
                '[auth] Password reset email delivery is not configured; the reset link was generated but not sent.'
            );
        } else {
            console.info(
                `[auth] Password reset link for ${user.email}: ${resetUrl}`
            );
        }

        return { resetUrl };
    }

    async resetPassword(token: string, newPassword: string) {
        let payload: ReturnType<typeof verifyPasswordResetToken>;

        try {
            payload = verifyPasswordResetToken(token);
        } catch {
            throw new AppError(400, 'This reset link is invalid or has expired');
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, passwordHash: true },
        });

        if (!user) {
            throw new AppError(400, 'This reset link is invalid or has expired');
        }

        const providedFingerprint = Buffer.from(payload.pwd);
        const currentFingerprint = Buffer.from(
            passwordFingerprint(user.passwordHash)
        );

        if (
            providedFingerprint.length !== currentFingerprint.length ||
            !timingSafeEqual(providedFingerprint, currentFingerprint)
        ) {
            throw new AppError(400, 'This reset link is invalid or has expired');
        }

        const passwordUnchanged = await bcrypt.compare(
            newPassword,
            user.passwordHash
        );

        if (passwordUnchanged) {
            throw new AppError(
                400,
                'New password must be different from your current password'
            );
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { passwordHash },
            }),
            prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
        ]);

        return {
            message:
                'Password reset successfully. Sign in with your new password.',
        };
    }

    async updatePassword(userId: string, input: UpdatePasswordInput) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, passwordHash: true },
        });

        if (!user) {
            throw new AppError(404, 'User not found');
        }

        const currentPasswordMatches = await bcrypt.compare(
            input.currentPassword,
            user.passwordHash
        );

        if (!currentPasswordMatches) {
            throw new AppError(400, 'Current password is incorrect');
        }

        const passwordUnchanged = await bcrypt.compare(
            input.newPassword,
            user.passwordHash
        );

        if (passwordUnchanged) {
            throw new AppError(
                400,
                'New password must be different from your current password'
            );
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(input.newPassword, salt);

        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        return { message: 'Password updated successfully' };
    }
}

export const authService = new AuthService();
