const APPLICATION_STATUS_LABELS: Record<string, string> = {
    SUBMITTED: 'Submitted',
    EVALUATING: 'Evaluating',
    ELIGIBLE: 'Eligible',
    NEEDS_REVIEW: 'Needs review',
    REDIRECTED: 'Redirected',
    INTERVIEW_PENDING: 'Interview pending',
    INTERVIEW_SCHEDULED: 'Interview scheduled',
    REJECTED: 'Rejected',
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
