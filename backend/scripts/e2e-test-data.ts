import { existsSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import {
    ApplicationStatus,
    InterviewStatus,
    PositionStatus,
    Prisma,
    PrismaClient,
    Role,
    SubscriptionTier,
} from '@prisma/client';

const envPath = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend/.env'),
].find(existsSync);

if (envPath) {
    dotenv.config({ path: envPath });
}

const prisma = new PrismaClient();

const TEST_DOMAIN = '@skillora.test';
const TEST_PASSWORD = 'password123';
const DEFAULT_DEADLINE_MINUTES = 5;

type RecruiterSeed = {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    wilaya: string;
    companyName: string;
};

type PositionSeed = {
    title: string;
    department: string;
    location: string;
    recruiterIndex: number;
    rubric: {
        mandatoryCriteria: string[];
        preferredCriteria: string[];
        minimumScoreThreshold: number;
    };
};

type ApplicantSeed = {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    wilaya: string;
    skills: string[];
    projectTitle: string;
};

type CreatedApplicant = ApplicantSeed & {
    id: string;
    profileId: string;
};

type CreatedPosition = {
    id: string;
    recruiterId: string;
    seed: PositionSeed;
    expectedApplications: number;
};

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
    const prefix = `--${name}=`;
    return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const dryRun = flag('dry-run');
const verifyApi = flag('verify');
const apiBase = (option('api-base') ?? 'http://localhost:4000').replace(
    /\/$/,
    ''
);
const deadlineMinutes = Number(
    option('deadline-minutes') ?? DEFAULT_DEADLINE_MINUTES
);

if (!Number.isFinite(deadlineMinutes) || deadlineMinutes <= 0) {
    throw new Error('--deadline-minutes must be a positive number');
}

const RECRUITERS: RecruiterSeed[] = [
    {
        email: 'e2e.recruiter1@skillora.test',
        firstName: 'Aymen',
        lastName: 'Bensalem',
        phone: '+213 550 10 00 01',
        wilaya: '16 - Alger',
        companyName: 'Atlas Cloud',
    },
    {
        email: 'e2e.recruiter2@skillora.test',
        firstName: 'Lina',
        lastName: 'Cherif',
        phone: '+213 550 10 00 02',
        wilaya: '16 - Alger',
        companyName: 'Numidia Systems',
    },
    {
        email: 'e2e.recruiter3@skillora.test',
        firstName: 'Yacine',
        lastName: 'Bouzid',
        phone: '+213 550 10 00 03',
        wilaya: '31 - Oran',
        companyName: 'Tell Platform',
    },
    {
        email: 'e2e.recruiter4@skillora.test',
        firstName: 'Nadia',
        lastName: 'Rahmani',
        phone: '+213 550 10 00 04',
        wilaya: '25 - Constantine',
        companyName: 'Sahara Telecom',
    },
    {
        email: 'e2e.recruiter5@skillora.test',
        firstName: 'Sofiane',
        lastName: 'Meziane',
        phone: '+213 550 10 00 05',
        wilaya: '16 - Alger',
        companyName: 'Mediterranean Bank',
    },
    {
        email: 'e2e.recruiter6@skillora.test',
        firstName: 'Imane',
        lastName: 'Boudiaf',
        phone: '+213 550 10 00 06',
        wilaya: '19 - Sétif',
        companyName: 'Aurassi Energy',
    },
];

const POSITIONS: PositionSeed[] = [
    {
        title: 'Cloud Infrastructure Engineer',
        department: 'Cloud & Systems',
        location: 'Algiers (Hybrid)',
        recruiterIndex: 0,
        rubric: {
            mandatoryCriteria: ['Docker', 'Linux', 'CI/CD'],
            preferredCriteria: ['Go', 'Kubernetes'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'Backend Developer',
        department: 'Core Services',
        location: 'Algiers (Remote)',
        recruiterIndex: 1,
        rubric: {
            mandatoryCriteria: ['Go', 'PostgreSQL', 'Docker'],
            preferredCriteria: ['Microservices', 'Kafka'],
            minimumScoreThreshold: 72,
        },
    },
    {
        title: 'Platform Engineer',
        department: 'Infrastructure',
        location: 'Oran (Hybrid)',
        recruiterIndex: 2,
        rubric: {
            mandatoryCriteria: ['Linux', 'Kubernetes', 'Terraform'],
            preferredCriteria: ['AWS', 'CI/CD'],
            minimumScoreThreshold: 75,
        },
    },
];

const FIRST_NAMES = [
    'Amine',
    'Sara',
    'Yacine',
    'Nour',
    'Riad',
    'Lina',
    'Samir',
];

const LAST_NAMES = [
    'Benali',
    'Khelifi',
    'Bouzid',
    'Mansouri',
    'Haddad',
    'Cherif',
    'Rahmani',
];

const WILAYAS = [
    '16 - Alger',
    '31 - Oran',
    '25 - Constantine',
    '19 - Sétif',
    '09 - Blida',
    '23 - Annaba',
    '15 - Tizi Ouzou',
];

const SKILLS = [
    'Docker',
    'Linux',
    'CI/CD',
    'Go',
    'PostgreSQL',
    'Kubernetes',
    'Terraform',
    'AWS',
];

const APPLICANTS: ApplicantSeed[] = Array.from({ length: 35 }, (_, index) => {
    const number = index + 1;
    return {
        email: `e2e.applicant${String(number).padStart(2, '0')}${TEST_DOMAIN}`,
        firstName: FIRST_NAMES[index % FIRST_NAMES.length],
        lastName:
            LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length],
        phone: `+213 550 20 ${String(number).padStart(2, '0')} ${String(number).padStart(2, '0')}`,
        wilaya: WILAYAS[index % WILAYAS.length],
        skills: SKILLS.filter(
            (_, skillIndex) => (index + skillIndex) % 4 !== 0
        ).slice(0, 5),
        projectTitle: `E2E Platform Project ${number}`,
    };
});

/**
 * The requested totals are 15 + 10 + 20 = 45 applications across only 35
 * applicants. Applicants 16-25 apply to both the second and third position,
 * which gives every applicant at least one application and 10 applicants two.
 */
const APPLICANT_INDEXES_BY_POSITION = [
    Array.from({ length: 15 }, (_, index) => index),
    Array.from({ length: 10 }, (_, index) => 15 + index),
    Array.from({ length: 20 }, (_, index) => 15 + index),
];

function planStatuses(count: number): ApplicationStatus[] {
    const interviews = count >= 15 ? 3 : 2;
    const eligible = Math.ceil(count * 0.2);
    const needsReview = Math.ceil(count * 0.2);
    const submitted = 1;
    const redirected =
        count - interviews - eligible - needsReview - submitted;

    return [
        ...Array<ApplicationStatus>(interviews).fill(
            ApplicationStatus.INTERVIEW_PENDING
        ),
        ...Array<ApplicationStatus>(eligible).fill(ApplicationStatus.ELIGIBLE),
        ...Array<ApplicationStatus>(needsReview).fill(
            ApplicationStatus.NEEDS_REVIEW
        ),
        ...Array<ApplicationStatus>(submitted).fill(
            ApplicationStatus.SUBMITTED
        ),
        ...Array<ApplicationStatus>(redirected).fill(
            ApplicationStatus.REDIRECTED
        ),
    ];
}

function auditFor(
    position: PositionSeed,
    status: ApplicationStatus,
    seedIndex: number
): Prisma.InputJsonValue | undefined {
    if (status === ApplicationStatus.SUBMITTED) return undefined;

    const unmet =
        status === ApplicationStatus.REDIRECTED ?
            position.rubric.mandatoryCriteria.slice(-2)
        : status === ApplicationStatus.NEEDS_REVIEW ?
            position.rubric.mandatoryCriteria.slice(-1)
        :   [];

    return {
        mandatoryCriteriaAudit: position.rubric.mandatoryCriteria.map(
            (criterion) => {
                const satisfied = !unmet.includes(criterion);
                return {
                    criterion,
                    satisfied,
                    evidenceFound:
                        satisfied ?
                            `Verified qualification for ${criterion}`
                        :   null,
                };
            }
        ),
        strengths: position.rubric.mandatoryCriteria.filter(
            (criterion) => !unmet.includes(criterion)
        ),
        unmetRequirements: unmet,
        evaluatedAt: new Date(
            Date.now() - seedIndex * 60_000
        ).toISOString(),
    };
}

function gapFor(
    position: PositionSeed,
    status: ApplicationStatus
): Prisma.InputJsonValue | undefined {
    if (status !== ApplicationStatus.REDIRECTED) return undefined;

    const unmet = position.rubric.mandatoryCriteria.slice(-2);
    const focus = unmet[0] ?? 'the missing criterion';

    return {
        badge: 'ACTIONABLE GAP ANALYSIS [ZERO GHOSTING]',
        headlineReason: `Why this resume was not selected for ${position.title}`,
        verifiedStrengths: position.rubric.mandatoryCriteria.filter(
            (criterion) => !unmet.includes(criterion)
        ),
        unmetMandatoryReasons: unmet.map(
            (criterion) => `Missing mandatory requirement: ${criterion}`
        ),
        recommendedBridgePath: {
            title: `Build verifiable proof for ${focus}`,
            actionableMilestones: [
                `Ship a small project that demonstrates ${focus}.`,
                'Attach the artifact to your resume and apply again.',
            ],
        },
    };
}

function matchScoreFor(status: ApplicationStatus, index: number): number | null {
    if (status === ApplicationStatus.SUBMITTED) return null;
    if (
        status === ApplicationStatus.INTERVIEW_PENDING ||
        status === ApplicationStatus.ELIGIBLE
    ) {
        return 82 + ((index * 7) % 16);
    }
    if (status === ApplicationStatus.NEEDS_REVIEW) {
        return 66 + ((index * 5) % 10);
    }
    return 40 + ((index * 3) % 22);
}

function interviewRanges() {
    const first = new Date();
    first.setDate(first.getDate() + 3);
    first.setHours(10, 0, 0, 0);

    const second = new Date();
    second.setDate(second.getDate() + 5);
    second.setHours(14, 30, 0, 0);

    return [
        {
            startTime: first.toISOString(),
            endTime: new Date(
                first.getTime() + 60 * 60 * 1000
            ).toISOString(),
            format: 'video_meet',
        },
        {
            startTime: second.toISOString(),
            endTime: new Date(
                second.getTime() + 60 * 60 * 1000
            ).toISOString(),
            format: 'video_meet',
        },
    ];
}

async function createApplicant(
    seed: ApplicantSeed,
    index: number,
    passwordHash: string
): Promise<CreatedApplicant> {
    const description = `${seed.projectTitle} is a small production-style platform project used for E2E testing.`;
    const user = await prisma.user.create({
        data: {
            email: seed.email,
            passwordHash,
            firstName: seed.firstName,
            lastName: seed.lastName,
            phone: seed.phone,
            wilaya: seed.wilaya,
            role: Role.APPLICANT,
            subscriptionTier: SubscriptionTier.FREE,
        },
    });

    const [education, experience, project, certification, link] =
        await Promise.all([
            prisma.vaultEducation.create({
                data: {
                    userId: user.id,
                    degree:
                        index % 2 === 0 ?
                            'Master en Génie Logiciel'
                        :   'Licence en Informatique',
                    institution: 'Université des Sciences et de la Technologie',
                    field: 'Informatique',
                    startDate: '2019-09-01',
                    endDate: '2024-07-01',
                },
            }),
            prisma.vaultExperience.create({
                data: {
                    userId: user.id,
                    company: 'E2E Labs',
                    role: 'Junior Platform Engineer',
                    location: 'Algiers',
                    startDate: '2023-01-01',
                    endDate: '2024-06-30',
                    highlights: [
                        'Maintained containerized services and CI pipelines.',
                        'Documented deployment and rollback procedures.',
                    ],
                },
            }),
            prisma.vaultProject.create({
                data: {
                    userId: user.id,
                    title: seed.projectTitle,
                    projectUrl: `https://github.com/e2e-applicant-${String(index + 1).padStart(2, '0')}/platform-project`,
                    description,
                    date: '2024-05-01',
                    narratives: [{ label: 'Overview', text: description }],
                    tags: seed.skills.slice(0, 3),
                },
            }),
            prisma.vaultCertification.create({
                data: {
                    userId: user.id,
                    name:
                        index % 2 === 0 ?
                            'AWS Certified Cloud Practitioner'
                        :   'Certified Kubernetes Administrator',
                    issuer:
                        index % 2 === 0 ? 'Amazon Web Services' : 'CNCF',
                    issueDate: '2024-03-15',
                    credentialId: `E2E-CERT-${String(index + 1).padStart(3, '0')}`,
                },
            }),
            prisma.vaultLink.create({
                data: {
                    userId: user.id,
                    label: 'GitHub',
                    url: `https://github.com/e2e-applicant-${String(index + 1).padStart(2, '0')}`,
                    type: 'github',
                },
            }),
        ]);

    const profile = await prisma.applicantProfile.create({
        data: {
            userId: user.id,
            title: 'Platform Engineer Resume',
            summary:
                'E2E applicant with hands-on platform, backend, and infrastructure project experience.',
            skills: seed.skills,
            selectedEducationIds: [education.id],
            selectedExperienceIds: [experience.id],
            selectedProjectIds: [project.id],
            selectedCertificationIds: [certification.id],
            selectedLinkIds: [link.id],
        },
    });

    return { ...seed, id: user.id, profileId: profile.id };
}

async function seed(): Promise<{
    positions: CreatedPosition[];
    applicants: CreatedApplicant[];
    totalApplications: number;
    expiresAt: Date;
}> {
    console.log('Removing previous E2E users from', TEST_DOMAIN, '...');
    await prisma.user.deleteMany({
        where: { email: { endsWith: TEST_DOMAIN } },
    });

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const recruiters = [];

    for (const seedRecruiter of RECRUITERS) {
        const recruiter = await prisma.user.create({
            data: {
                email: seedRecruiter.email,
                passwordHash,
                firstName: seedRecruiter.firstName,
                lastName: seedRecruiter.lastName,
                phone: seedRecruiter.phone,
                wilaya: seedRecruiter.wilaya,
                companyName: seedRecruiter.companyName,
                role: Role.RECRUITER,
                subscriptionTier: SubscriptionTier.ENTERPRISE,
            },
        });
        recruiters.push(recruiter);
    }

    console.log(`Created ${recruiters.length} recruiters`);

    const now = new Date();
    const expiresAt = new Date(
        now.getTime() + deadlineMinutes * 60 * 1000
    );
    const positions: CreatedPosition[] = [];

    for (let index = 0; index < POSITIONS.length; index += 1) {
        const seedPosition = POSITIONS[index];
        const recruiter = recruiters[seedPosition.recruiterIndex];
        const position = await prisma.position.create({
            data: {
                recruiterId: recruiter.id,
                companyName: recruiter.companyName ?? 'E2E Company',
                title: seedPosition.title,
                department: seedPosition.department,
                location: seedPosition.location,
                createdAt: now,
                deadline: expiresAt,
                status: PositionStatus.OPEN,
                rubric: seedPosition.rubric,
            },
        });

        await prisma.recruiterSlot.createMany({
            data: [
                {
                    positionId: position.id,
                    dayOfWeek: 1,
                    startTime: '09:00',
                    endTime: '12:00',
                },
                {
                    positionId: position.id,
                    dayOfWeek: 3,
                    startTime: '14:00',
                    endTime: '17:00',
                },
                {
                    positionId: position.id,
                    dayOfWeek: 5,
                    startTime: '09:00',
                    endTime: '12:00',
                },
            ],
        });

        positions.push({
            id: position.id,
            recruiterId: recruiter.id,
            seed: seedPosition,
            expectedApplications: APPLICANT_INDEXES_BY_POSITION[index].length,
        });
    }

    console.log(`Created ${positions.length} positions, expiring in ${deadlineMinutes} minutes`);

    const applicants: CreatedApplicant[] = [];
    for (let index = 0; index < APPLICANTS.length; index += 1) {
        applicants.push(
            await createApplicant(APPLICANTS[index], index, passwordHash)
        );
    }

    console.log(`Created ${applicants.length} applicants and tailored resumes`);

    let applicationNumber = 0;
    let totalApplications = 0;

    for (let positionIndex = 0; positionIndex < positions.length; positionIndex += 1) {
        const position = positions[positionIndex];
        const applicantIndexes = APPLICANT_INDEXES_BY_POSITION[positionIndex];
        const statuses = planStatuses(applicantIndexes.length);

        for (let index = 0; index < applicantIndexes.length; index += 1) {
            const applicant = applicants[applicantIndexes[index]];
            const status = statuses[index];
            applicationNumber += 1;
            totalApplications += 1;

            const application = await prisma.application.create({
                data: {
                    positionId: position.id,
                    applicantId: applicant.id,
                    profileId: applicant.profileId,
                    anonymousId: `DZ-E${String(applicationNumber).padStart(3, '0')}`,
                    status,
                    matchScore: matchScoreFor(status, index),
                    rubricAudit: auditFor(position.seed, status, index),
                    gapAnalysis: gapFor(position.seed, status),
                    appliedAt: new Date(
                        now.getTime() - index * 15_000
                    ),
                },
            });

            if (status === ApplicationStatus.INTERVIEW_PENDING) {
                await prisma.interviewEvent.create({
                    data: {
                        applicationId: application.id,
                        applicantId: applicant.id,
                        recruiterId: position.recruiterId,
                        status: InterviewStatus.RANGE_PENDING,
                        proposedRanges: interviewRanges(),
                    },
                });
            }
        }

        console.log(
            `Created ${applicantIndexes.length} applications for "${position.seed.title}"`
        );
    }

    return { positions, applicants, totalApplications, expiresAt };
}

async function apiLogin(email: string): Promise<string> {
    const response = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: TEST_PASSWORD }),
    });

    if (!response.ok) {
        throw new Error(
            `Login failed for ${email} (${response.status}): ${await response.text()}`
        );
    }

    const body = (await response.json()) as { accessToken?: string };
    if (!body.accessToken) {
        throw new Error(`Login response for ${email} did not include an access token`);
    }
    return body.accessToken;
}

async function apiGet(path: string, token: string): Promise<any> {
    const response = await fetch(`${apiBase}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        throw new Error(
            `GET ${path} failed (${response.status}): ${await response.text()}`
        );
    }

    return response.json();
}

async function verifySeedThroughApi(
    positions: CreatedPosition[],
    applicants: CreatedApplicant[]
): Promise<void> {
    try {
        const health = await fetch(`${apiBase}/health`);
        if (!health.ok) {
            throw new Error(`health check returned ${health.status}`);
        }
    } catch (error) {
        throw new Error(
            `API verification requested, but ${apiBase} is unreachable. Start the backend or omit --verify. (${String(error)})`
        );
    }

    for (let index = 0; index < 3; index += 1) {
        const recruiter = RECRUITERS[index];
        const position = positions[index];
        const token = await apiLogin(recruiter.email);
        const data = await apiGet('/api/v1/recruiter/positions', token);
        const found = (data.positions ?? []).find(
            (candidate: { id: string }) => candidate.id === position.id
        );

        if (!found) {
            throw new Error(
                `Recruiter ${recruiter.email} cannot see "${position.seed.title}"`
            );
        }

        const applications = await apiGet(
            `/api/v1/recruiter/positions/${position.id}/applications`,
            token
        );

        if ((applications.applications ?? []).length !== position.expectedApplications) {
            throw new Error(
                `Expected ${position.expectedApplications} applications for "${position.seed.title}", got ${(applications.applications ?? []).length}`
            );
        }

        console.log(
            `API OK: ${recruiter.email} sees ${applications.applications.length} applications for "${position.seed.title}"`
        );
    }

    const firstApplicantToken = await apiLogin(applicants[0].email);
    const firstApplicantApplications = await apiGet(
        '/api/v1/applicant/applications',
        firstApplicantToken
    );
    if ((firstApplicantApplications.applications ?? []).length !== 1) {
        throw new Error('Applicant 1 should have exactly 1 application');
    }

    const overlappingApplicantToken = await apiLogin(applicants[15].email);
    const overlappingApplications = await apiGet(
        '/api/v1/applicant/applications',
        overlappingApplicantToken
    );
    if ((overlappingApplications.applications ?? []).length !== 2) {
        throw new Error('Applicant 16 should have exactly 2 applications');
    }

    const publicPositions = await apiGet(
        '/api/v1/public/positions',
        firstApplicantToken
    );
    const publicIds = new Set(
        (publicPositions.positions ?? []).map(
            (position: { id: string }) => position.id
        )
    );
    const missingPublicPositions = positions.filter(
        (position) => !publicIds.has(position.id)
    );

    if (missingPublicPositions.length > 0) {
        throw new Error(
            `Public jobs API is missing: ${missingPublicPositions
                .map((position) => position.seed.title)
                .join(', ')}. They may have expired; re-run the seed.`
        );
    }

    console.log('API verification passed: recruiters, applicants, and public jobs all match.');
}

function printPlan(expiresAt: Date): void {
    console.log('\nE2E test data plan');
    console.log('------------------------------------------------------------');
    console.log(`Recruiters: ${RECRUITERS.length}`);
    console.log(`Positions: ${POSITIONS.length} (expire in ${deadlineMinutes} minutes at ${expiresAt.toISOString()})`);
    console.log(`Applicants: ${APPLICANTS.length}`);
    console.log('Applications: 45 total');
    console.log('  - Cloud Infrastructure Engineer: 15');
    console.log('  - Backend Developer: 10');
    console.log('  - Platform Engineer: 20');
    console.log('Applicants with two applications: 10 (applicants 16-25)');
    console.log('All accounts use password:', TEST_PASSWORD);
    console.log(`Recruiter login: ${RECRUITERS[0].email}`);
    console.log(`Applicant login: ${APPLICANTS[0].email}`);
    console.log('------------------------------------------------------------');
}

async function main(): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + deadlineMinutes * 60 * 1000);

    printPlan(expiresAt);

    if (dryRun) {
        console.log('\nDry run: no database changes were made.');
        return;
    }

    const result = await seed();

    const summary = await prisma.application.groupBy({
        by: ['positionId'],
        where: {
            positionId: {
                in: result.positions.map((position) => position.id),
            },
        },
        _count: { _all: true },
    });
    const totalApplications = summary.reduce(
        (total, item) => total + item._count._all,
        0
    );

    if (totalApplications !== 45) {
        throw new Error(`Expected 45 applications, found ${totalApplications}`);
    }

    console.log('\nE2E dataset ready');
    console.log('------------------------------------------------------------');
    console.log(`Recruiters: ${RECRUITERS.length}`);
    console.log(`Positions: ${result.positions.length} (deadline ${result.expiresAt.toISOString()})`);
    console.log(`Applicants: ${result.applicants.length}`);
    console.log(`Applications: ${result.totalApplications}`);
    console.log('All E2E accounts use password:', TEST_PASSWORD);
    console.log(`Recruiter login: ${RECRUITERS[0].email}`);
    console.log(`Applicant login: ${APPLICANTS[0].email}`);
    console.log('------------------------------------------------------------');

    if (verifyApi) {
        await verifySeedThroughApi(result.positions, result.applicants);
    } else {
        console.log('Run with --verify to check the seeded data through the running API.');
    }
}

main()
    .catch((error) => {
        console.error('E2E seed failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
