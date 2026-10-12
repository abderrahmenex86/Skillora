import { prisma } from '../../db/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
    CreateProfileInput,
    UpdateProfileInput,
    SubmitApplicationInput,
} from './applicant.schema.js';
import { evaluationQueue } from '../../queues/queue.config.js';

export class ApplicantService {
    async getProfiles(userId: string) {
        return prisma.applicantProfile.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { applications: true },
                },
            },
        });
    }

    async createProfile(userId: string, input: CreateProfileInput) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { subscriptionTier: true },
        });

        if (!user) {
            throw new AppError(404, 'User not found');
        }

        if (user.subscriptionTier === 'FREE') {
            const existingProfilesCount = await prisma.applicantProfile.count({
                where: { userId },
            });

            if (existingProfilesCount >= 1) {
                throw new AppError(
                    403,
                    'Free plan accounts are limited to 1 active profile. Upgrade to Pro for multi-profile personas (e.g. Data Engineer, Pen Tester, Legal Counsel).'
                );
            }
        }

        return prisma.applicantProfile.create({
            data: {
                userId,
                title: input.title,
                resumeUrl: input.resumeUrl,
                summary: input.summary,
                skills: input.skills,
                metadata: input.metadata,
            },
        });
    }

    async updateProfile(
        userId: string,
        profileId: string,
        input: UpdateProfileInput
    ) {
        const profile = await prisma.applicantProfile.findFirst({
            where: { id: profileId, userId },
        });

        if (!profile) {
            throw new AppError(404, 'Profile not found or access denied');
        }

        return prisma.applicantProfile.update({
            where: { id: profileId },
            data: {
                title: input.title,
                resumeUrl: input.resumeUrl,
                summary: input.summary,
                skills: input.skills,
                metadata: input.metadata,
            },
        });
    }

    async deleteProfile(userId: string, profileId: string) {
        const profile = await prisma.applicantProfile.findFirst({
            where: { id: profileId, userId },
            include: {
                applications: {
                    where: {
                        status: {
                            in: [
                                'SUBMITTED',
                                'EVALUATING',
                                'INTERVIEW_PENDING',
                            ],
                        },
                    },
                },
            },
        });

        if (!profile) {
            throw new AppError(404, 'Profile not found or access denied');
        }

        if (profile.applications.length > 0) {
            throw new AppError(
                400,
                'Cannot delete profile with active or pending job evaluations'
            );
        }

        await prisma.applicantProfile.delete({
            where: { id: profileId },
        });

        return { message: 'Profile deleted successfully' };
    }

    async submitApplication(userId: string, input: SubmitApplicationInput) {
        const position = await prisma.position.findUnique({
            where: { id: input.positionId },
        });

        if (!position) {
            throw new AppError(404, 'Position not found');
        }

        if (position.status !== 'OPEN') {
            throw new AppError(
                400,
                'This position is closed to new applicants'
            );
        }

        if (new Date() >= new Date(position.deadline)) {
            throw new AppError(
                400,
                'The application deadline for this position has passed'
            );
        }

        const profile = await prisma.applicantProfile.findFirst({
            where: { id: input.profileId, userId },
        });

        if (!profile) {
            throw new AppError(
                404,
                'Selected profile not found or does not belong to you'
            );
        }

        const existingApplication = await prisma.application.findUnique({
            where: {
                positionId_applicantId: {
                    positionId: input.positionId,
                    applicantId: userId,
                },
            },
        });

        if (existingApplication) {
            throw new AppError(
                409,
                'You have already applied to this position'
            );
        }

        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const anonymousId = `DZ-${randomSuffix}`;

        const application = await prisma.application.create({
            data: {
                positionId: input.positionId,
                applicantId: userId,
                profileId: input.profileId,
                anonymousId,
                status: 'SUBMITTED',
            },
            include: {
                position: {
                    select: {
                        title: true,
                        companyName: true,
                        deadline: true,
                    },
                },
                profile: {
                    select: {
                        title: true,
                    },
                },
            },
        });
        await evaluationQueue.add('evaluate-application', {
            applicationId: application.id,
        });

        return application;
    }

    async getMyApplications(userId: string) {
        return prisma.application.findMany({
            where: { applicantId: userId },
            orderBy: { appliedAt: 'desc' },
            include: {
                position: {
                    select: {
                        id: true,
                        title: true,
                        companyName: true,
                        location: true,
                        deadline: true,
                        status: true,
                    },
                },
                profile: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                interviewEvent: {
                    select: {
                        id: true,
                        status: true,
                        confirmedStart: true,
                        confirmedEnd: true,
                        meetingLink: true,
                    },
                },
            },
        });
    }
}

export const applicantService = new ApplicantService();
