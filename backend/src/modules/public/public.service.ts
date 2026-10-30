import { prisma } from '../../db/prisma.js';

const PUBLIC_POSITION_SELECT = {
    id: true,
    companyName: true,
    title: true,
    department: true,
    location: true,
    deadline: true,
    status: true,
    interviewCapacity: true,
    interviewRangeStart: true,
    interviewRangeEnd: true,
    rubric: true,
    createdAt: true,
} as const;

type PublicPositionRow = {
    id: string;
    companyName: string;
    title: string;
    department: string;
    location: string;
    deadline: Date;
    status: string;
    interviewCapacity: number | null;
    interviewRangeStart: Date | null;
    interviewRangeEnd: Date | null;
    rubric: unknown;
    createdAt: Date;
};

function toPublicPosition(position: PublicPositionRow) {
    const rubric =
        position.rubric && typeof position.rubric === 'object' ?
            (position.rubric as { mandatoryCriteria?: unknown })
        :   {};

    return {
        ...position,
        rubric: {
            mandatoryCriteria: Array.isArray(rubric.mandatoryCriteria) ?
                rubric.mandatoryCriteria
            :   [],
        },
    };
}

export async function listPublicPositions() {
    const positions = await prisma.position.findMany({
        where: {
            status: 'OPEN',
            deadline: { gt: new Date() },
            company: { status: 'APPROVED' },
        },
        orderBy: { deadline: 'asc' },
        select: PUBLIC_POSITION_SELECT,
    });

    return positions.map((position) =>
        toPublicPosition(position as PublicPositionRow)
    );
}

export async function getPublicPosition(id: string) {
    const position = await prisma.position.findFirst({
        where: { id, company: { status: 'APPROVED' } },
        select: PUBLIC_POSITION_SELECT,
    });

    if (!position || position.status === 'DRAFT') {
        return null;
    }

    return toPublicPosition(position as PublicPositionRow);
}
