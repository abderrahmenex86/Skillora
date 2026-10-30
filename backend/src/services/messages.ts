import { prisma } from '../db/prisma.js';

type ApplicationContext = {
    applicantId: string;
    positionTitle: string;
    companyName: string;
    positionStatus?: string;
};

function statusCopy(status: string, context: ApplicationContext) {
    const position = `${context.positionTitle} at ${context.companyName}`;

    switch (status) {
        case 'SUBMITTED':
            return {
                title: 'Application received',
                body: `Your application for ${position} was received. We are auditing your qualifications now.`,
            };
        case 'INTERVIEW_PENDING':
            return {
                title: 'Interview being scheduled',
                body: `Your application for ${position} passed the qualification audit. Interview scheduling is in progress.`,
            };
        case 'ELIGIBLE':
            return {
                title: 'Qualifications verified',
                body: `Your qualifications meet the rubric for ${position}. Interview scheduling is the next step.`,
            };
        case 'NEEDS_REVIEW':
            return {
                title: 'Application under review',
                body: `A recruiter is reviewing your application for ${position}. You will receive another update when a decision is made.`,
            };
        case 'ON_HOLD':
            if (context.positionStatus === 'CLOSED') {
                return {
                    title: 'Position closed',
                    body: `The position ${position} has closed. Your application remains in the talent pool; we will contact you if the team reopens the role.`,
                };
            }

            return {
                title: 'You are still shortlisted',
                body: `Your qualifications meet the requirements for ${position}, but other better-suited candidates were selected because the number of interview seats is limited. You are still shortlisted — if one of the top candidates changes their mind, we will send you an invitation.`,
            };
        case 'REJECTED':
            return {
                title: 'Application not selected',
                body: `Your application for ${position} was not selected. Any feedback is available in your dashboard.`,
            };
        case 'REDIRECTED':
            return {
                title: 'Your gap roadmap is ready',
                body: `Your application for ${position} was not selected. Review the actionable gap roadmap in your dashboard and re-apply when you have closed the gaps.`,
            };
        case 'DECLINED':
            return {
                title: 'Interview declined',
                body: `You declined the interview offer for ${position}. Your application is now closed for this position.`,
            };
        case 'INTERVIEW_SCHEDULED':
            return {
                title: 'Interview confirmed',
                body: `Your interview for ${position} is confirmed. The meeting details are available in your dashboard.`,
            };
        case 'REJECTED':
            return {
                title: 'Application update',
                body: `Your application for ${position} was not selected. You can review the feedback in your dashboard.`,
            };
        case 'CLOSED':
            return {
                title: 'Application closed',
                body: `The position ${position} is no longer accepting applications. Your existing application remains available in your dashboard.`,
            };
        default:
            return {
                title: 'Application update',
                body: `There is a new update on your application for ${position}.`,
            };
    }
}

export async function createApplicantMessage(input: {
    userId: string;
    applicationId?: string | null;
    kind: string;
    title: string;
    body: string;
}) {
    try {
        return await prisma.message.create({
            data: {
                userId: input.userId,
                applicationId: input.applicationId ?? null,
                kind: input.kind,
                title: input.title,
                body: input.body,
            },
        });
    } catch (error) {
        console.warn(
            '[messages] Could not create applicant message:',
            error instanceof Error ? error.message : error
        );
        return null;
    }
}

/**
 * Creates a notification for an application status. Repeated evaluations of
 * the same application for the same status are deduplicated for one minute.
 */
export async function notifyApplicationStatus(
    applicationId: string,
    status: string
) {
    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        select: {
            applicantId: true,
            position: {
                select: {
                    title: true,
                    companyName: true,
                    status: true,
                    deadline: true,
                },
            },
        },
    });

    if (!application) return null;

    const duplicate = await prisma.message.findFirst({
        where: {
            applicationId,
            kind: status,
            createdAt: { gte: new Date(Date.now() - 60_000) },
        },
        select: { id: true },
    });

    if (duplicate) return duplicate;

    const positionStatus =
        application.position.status === 'CLOSED' ||
        new Date(application.position.deadline) <= new Date()
            ? 'CLOSED'
            : application.position.status;

    const copy = statusCopy(status, {
        applicantId: application.applicantId,
        positionTitle: application.position.title,
        companyName: application.position.companyName,
        positionStatus,
    });

    return createApplicantMessage({
        userId: application.applicantId,
        applicationId,
        kind: status,
        title: copy.title,
        body: copy.body,
    });
}
