const APPLICATION_STATUS_LABELS: Record<string, string> = {
    SUBMITTED: 'Submitted',
    EVALUATING: 'Evaluating',
    ELIGIBLE: 'Eligible',
    NEEDS_REVIEW: 'Needs review',
    ON_HOLD: 'On hold',
    REDIRECTED: 'Rejected',
    INTERVIEW_PENDING: 'Interview pending',
    INTERVIEW_SCHEDULED: 'Interview scheduled',
    REJECTED: 'Rejected',
    DECLINED: 'Declined',
    CLOSED: 'Closed',
};

export function formatApplicationStatus(status: string): string {
    return (
        APPLICATION_STATUS_LABELS[status] ??
        status
            .toLowerCase()
            .replaceAll('_', ' ')
            .replace(/^\w/, (letter) => letter.toUpperCase())
    );
}
