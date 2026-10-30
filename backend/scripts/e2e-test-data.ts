import 'dotenv/config';
import { existsSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { notifyApplicationStatus } from '../src/services/messages.js';
import {
    ApplicationStatus,
    CompanyEventType,
    CompanyStatus,
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
const DEFAULT_DEADLINE_MINUTES = 1;
const ADMIN_EMAIL = `admin${TEST_DOMAIN}`;
const PENDING_RECRUITER_EMAIL = `e2e.pending${TEST_DOMAIN}`;
const REJECTED_RECRUITER_EMAIL = `e2e.rejected${TEST_DOMAIN}`;

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
    branchLabel: string;
    description: string;
    minimumYearsExperience: number;
    recruiterIndex: number;
    rubric: {
        mandatoryCriteria: string[];
        preferredCriteria: string[];
        minimumScoreThreshold: number;
    };
};

type CompanySeed = {
    name: string;
    employeeCount: number;
    industry: string;
    website: string;
    description: string;
    memberIndexes: number[];
    departments: string[];
    branches: Array<{ label: string; wilaya: string; headquarters?: boolean }>;
};

const COMPANIES: CompanySeed[] = [
    {
        name: 'Atlas Cloud',
        employeeCount: 180,
        industry: 'Cloud infrastructure',
        website: 'https://atlas-cloud.example',
        description:
            'Atlas Cloud builds reliable cloud infrastructure for Algerian enterprises.',
        memberIndexes: [0, 3],
        departments: ['Cloud & Systems', 'Platform Reliability'],
        branches: [
            { label: 'Algiers HQ', wilaya: '16 - Alger', headquarters: true },
            { label: 'Blida Operations', wilaya: '09 - Blida' },
        ],
    },
    {
        name: 'Numidia Systems',
        employeeCount: 90,
        industry: 'Software engineering',
        website: 'https://numidia-systems.example',
        description:
            'Numidia Systems designs core transaction and data services for regional teams.',
        memberIndexes: [1, 4],
        departments: ['Core Services', 'Data Engineering'],
        branches: [
            { label: 'Algiers Remote Hub', wilaya: '16 - Alger', headquarters: true },
            { label: 'Constantine Office', wilaya: '25 - Constantine' },
        ],
    },
    {
        name: 'Tell Platform',
        employeeCount: 240,
        industry: 'Developer platform',
        website: 'https://tell-platform.example',
        description:
            'Tell Platform runs the internal developer platform for high-growth teams.',
        memberIndexes: [2, 5],
        departments: ['Infrastructure', 'Developer Experience'],
        branches: [
            { label: 'Oran Office', wilaya: '31 - Oran', headquarters: true },
            { label: 'Algiers Office', wilaya: '16 - Alger' },
        ],
    },
];

const PENDING_COMPANY: CompanySeed = {
    name: 'Cedar Mobility',
    employeeCount: 120,
    industry: 'Mobility',
    website: 'https://cedar-mobility.example',
    description:
        'Cedar Mobility is building intercity mobility infrastructure across northern Algeria.',
    memberIndexes: [],
    departments: ['Engineering', 'Operations'],
    branches: [
        { label: 'Algiers HQ', wilaya: '16 - Alger', headquarters: true },
        { label: "M'Sila Plant", wilaya: "28 - M'Sila" },
    ],
};

const REJECTED_COMPANY: CompanySeed = {
    name: 'Atlas Freight',
    employeeCount: 45,
    industry: 'Logistics',
    website: 'https://atlas-freight.example',
    description:
        'Atlas Freight coordinates freight forwarding and warehouse operations.',
    memberIndexes: [],
    departments: ['Logistics'],
    branches: [
        { label: 'Oran Depot', wilaya: '31 - Oran', headquarters: true },
    ],
};

const PENDING_RECRUITER: RecruiterSeed = {
    email: PENDING_RECRUITER_EMAIL,
    firstName: 'Meriem',
    lastName: 'Saidi',
    phone: '+213 550 10 00 07',
    wilaya: '16 - Alger',
    companyName: PENDING_COMPANY.name,
};

const REJECTED_RECRUITER: RecruiterSeed = {
    email: REJECTED_RECRUITER_EMAIL,
    firstName: 'Karim',
    lastName: 'Belaid',
    phone: '+213 550 10 00 08',
    wilaya: '31 - Oran',
    companyName: REJECTED_COMPANY.name,
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
        companyName: 'Atlas Cloud',
    },
    {
        email: 'e2e.recruiter5@skillora.test',
        firstName: 'Sofiane',
        lastName: 'Meziane',
        phone: '+213 550 10 00 05',
        wilaya: '16 - Alger',
        companyName: 'Numidia Systems',
    },
    {
        email: 'e2e.recruiter6@skillora.test',
        firstName: 'Imane',
        lastName: 'Boudiaf',
        phone: '+213 550 10 00 06',
        wilaya: '19 - Sétif',
        companyName: 'Tell Platform',
    },
];

const POSITIONS: PositionSeed[] = [
    {
        title: 'Cloud Infrastructure Engineer',
        department: 'Cloud & Systems',
        location: 'Algiers HQ · 16 - Alger',
        branchLabel: 'Algiers HQ',
        description:
            'Own our cloud infrastructure across Docker, Linux, and CI/CD. You will build reliable deployment pipelines, harden production systems, and partner with product teams on capacity and reliability.',
        minimumYearsExperience: 3,
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
        location: 'Algiers Remote Hub · 16 - Alger',
        branchLabel: 'Algiers Remote Hub',
        description:
            'Design and ship Go services backed by PostgreSQL and Docker. You will own APIs, data models, and production reliability for the core platform while collaborating closely with product and data teams.',
        minimumYearsExperience: 2,
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
        location: 'Oran Office · 31 - Oran',
        branchLabel: 'Oran Office',
        description:
            'Build the internal platform on Linux, Kubernetes, and Terraform. You will automate environments, improve developer experience across teams, and make reliable delivery the default.',
        minimumYearsExperience: 4,
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
    const scheduled = count >= 15 ? 3 : 2;
    const onHold = count >= 15 ? 2 : count >= 10 ? 2 : 3;
    const needsReview = Math.ceil(count * 0.2);
    const rejected = count - scheduled - onHold - needsReview;

    return [
        ...Array<ApplicationStatus>(scheduled).fill(
            ApplicationStatus.INTERVIEW_SCHEDULED
        ),
        ...Array<ApplicationStatus>(onHold).fill(ApplicationStatus.ON_HOLD),
        ...Array<ApplicationStatus>(needsReview).fill(
            ApplicationStatus.NEEDS_REVIEW
        ),
        ...Array<ApplicationStatus>(rejected).fill(
            ApplicationStatus.REJECTED
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
        status === ApplicationStatus.REJECTED ?
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
    if (status !== ApplicationStatus.REJECTED) return undefined;

    const unmet = position.rubric.mandatoryCriteria.slice(-2);
    const focus = unmet[0] ?? 'the missing criterion';
    const strengths = position.rubric.mandatoryCriteria.filter(
        (criterion) => !unmet.includes(criterion)
    );
    const letter = `Dear candidate,

Thank you for applying for ${position.title}. Your application demonstrated relevant strengths in ${strengths.join(', ') || 'several areas'}. However, this was a competitive cohort, and other candidates demonstrated stronger coverage of the mandatory requirements for this particular role.

The main gap for this posting was ${unmet.join(' and ')}. The review did not find sufficient verifiable proof of that capability in the submitted materials.

To strengthen future applications, focus on producing concrete artifacts related to the missing requirement, such as the project or certification path outlined below. Once that evidence is attached to your profile, you are encouraged to apply again.

Skillora Talent Team`;

    return {
        letter,
        verifiedStrengths: strengths,
        unmetMandatoryReasons: unmet.map(
            (criterion) => `Missing mandatory requirement: ${criterion}`
        ),
        recommendedBridgePath: {
            title: `Build verifiable proof for ${focus}`,
            actionableMilestones: [
                `Ship a small project that demonstrates ${focus}.`,
                `Document the design decisions and measurable outcome in a public repository.`,
                `Earn a recognized certification covering ${focus} if one is available, or publish a production-grade equivalent.`,
                'Attach the artifact or credential to your resume and apply again.',
            ],
            reapplicationReadinessMilestone: `Publish the ${focus} artifact and link it from your next application.`,
        },
    };
}

function matchScoreFor(status: ApplicationStatus, index: number): number | null {
    if (status === ApplicationStatus.SUBMITTED) return null;
    if (
        status === ApplicationStatus.INTERVIEW_SCHEDULED ||
        status === ApplicationStatus.INTERVIEW_PENDING ||
        status === ApplicationStatus.ELIGIBLE
    ) {
        return 90 + ((index * 3) % 8);
    }
    if (status === ApplicationStatus.ON_HOLD) {
        return 82 + ((index * 5) % 8);
    }
    if (status === ApplicationStatus.NEEDS_REVIEW) {
        return 66 + ((index * 5) % 10);
    }
    return 40 + ((index * 3) % 22);
}

function interviewSlot(index: number) {
    const start = new Date();
    start.setDate(start.getDate() + 2 + (index % 3));
    start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    return {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        format: 'video_meet' as const,
    };
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

    const admin = await prisma.user.create({
        data: {
            email: ADMIN_EMAIL,
            passwordHash,
            firstName: 'Skillora',
            lastName: 'Admin',
            role: Role.ADMIN,
        },
    });

    const recruiters = [];
    for (const seedRecruiter of [
        ...RECRUITERS,
        PENDING_RECRUITER,
        REJECTED_RECRUITER,
    ]) {
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

    console.log(`Created ${recruiters.length + 1} hiring-side accounts (6 approved recruiters, 1 pending, 1 rejected, 1 admin)`);

    const now = new Date();
    const companyByRecruiterIndex = new Map<
        number,
        {
            companyId: string;
            departments: Map<string, string>;
            branches: Map<string, string>;
        }
    >();

    for (const seedCompany of COMPANIES) {
        const owner = recruiters[seedCompany.memberIndexes[0]];
        const company = await prisma.company.create({
            data: {
                name: seedCompany.name,
                employeeCount: seedCompany.employeeCount,
                industry: seedCompany.industry,
                website: seedCompany.website,
                description: seedCompany.description,
                status: CompanyStatus.APPROVED,
                ownerId: owner.id,
                submittedAt: now,
                reviewedAt: now,
                reviewedById: admin.id,
                departments: {
                    create: seedCompany.departments.map((name) => ({ name })),
                },
                branches: {
                    create: seedCompany.branches.map((branch) => ({
                        label: branch.label,
                        wilaya: branch.wilaya,
                        isHeadquarters: branch.headquarters ?? false,
                    })),
                },
            },
            include: { departments: true, branches: true },
        });

        for (const memberIndex of seedCompany.memberIndexes) {
            await prisma.user.update({
                where: { id: recruiters[memberIndex].id },
                data: { companyId: company.id },
            });
            companyByRecruiterIndex.set(memberIndex, {
                companyId: company.id,
                departments: new Map(
                    company.departments.map((department) => [
                        department.name,
                        department.id,
                    ])
                ),
                branches: new Map(
                    company.branches.map((branch) => [branch.label, branch.id])
                ),
            });
        }

        await prisma.companyEvent.create({
            data: {
                companyId: company.id,
                adminId: admin.id,
                type: CompanyEventType.APPROVED,
                note: 'Seeded approved company.',
            },
        });
    }

    const pendingRecruiter = recruiters[RECRUITERS.length];
    const pendingCompany = await prisma.company.create({
        data: {
            name: PENDING_COMPANY.name,
            employeeCount: PENDING_COMPANY.employeeCount,
            industry: PENDING_COMPANY.industry,
            website: PENDING_COMPANY.website,
            description: PENDING_COMPANY.description,
            status: CompanyStatus.PENDING,
            ownerId: pendingRecruiter.id,
            submittedAt: now,
            departments: {
                create: PENDING_COMPANY.departments.map((name) => ({ name })),
            },
            branches: {
                create: PENDING_COMPANY.branches.map((branch) => ({
                    label: branch.label,
                    wilaya: branch.wilaya,
                    isHeadquarters: branch.headquarters ?? false,
                })),
            },
        },
    });
    await prisma.user.update({
        where: { id: pendingRecruiter.id },
        data: { companyId: pendingCompany.id },
    });
    await prisma.companyEvent.create({
        data: {
            companyId: pendingCompany.id,
            type: CompanyEventType.SUBMITTED,
            note: 'Seeded pending company awaiting review.',
        },
    });

    const rejectedRecruiter = recruiters[RECRUITERS.length + 1];
    const rejectedCompany = await prisma.company.create({
        data: {
            name: REJECTED_COMPANY.name,
            employeeCount: REJECTED_COMPANY.employeeCount,
            industry: REJECTED_COMPANY.industry,
            website: REJECTED_COMPANY.website,
            description: REJECTED_COMPANY.description,
            status: CompanyStatus.REJECTED,
            ownerId: rejectedRecruiter.id,
            submittedAt: now,
            reviewedAt: now,
            reviewedById: admin.id,
            rejectionReason:
                'The company profile could not be verified. Add a registered address and a reachable company website, then resubmit.',
            departments: {
                create: REJECTED_COMPANY.departments.map((name) => ({ name })),
            },
            branches: {
                create: REJECTED_COMPANY.branches.map((branch) => ({
                    label: branch.label,
                    wilaya: branch.wilaya,
                    isHeadquarters: branch.headquarters ?? false,
                })),
            },
        },
    });
    await prisma.user.update({
        where: { id: rejectedRecruiter.id },
        data: { companyId: rejectedCompany.id },
    });
    await prisma.companyEvent.create({
        data: {
            companyId: rejectedCompany.id,
            adminId: admin.id,
            type: CompanyEventType.REJECTED,
            note: 'The company profile could not be verified. Add a registered address and a reachable company website, then resubmit.',
        },
    });

    const expiresAt = new Date(
        now.getTime() + deadlineMinutes * 60 * 1000
    );
    const interviewRangeStart = new Date(
        now.getTime() + 24 * 60 * 60 * 1000
    );
    const interviewRangeEnd = new Date(
        now.getTime() + 6 * 24 * 60 * 60 * 1000
    );
    const interviewCapacities = [3, 2, 3];
    const positions: CreatedPosition[] = [];

    for (let index = 0; index < POSITIONS.length; index += 1) {
        const seedPosition = POSITIONS[index];
        const recruiter = recruiters[seedPosition.recruiterIndex];
        const companyEntry = companyByRecruiterIndex.get(
            seedPosition.recruiterIndex
        );
        const departmentId = companyEntry?.departments.get(
            seedPosition.department
        );
        const branchId = companyEntry?.branches.get(
            seedPosition.branchLabel
        );

        if (!companyEntry || !departmentId || !branchId) {
            throw new Error(
                `Could not resolve company/department/branch for ${seedPosition.title}`
            );
        }

        const position = await prisma.position.create({
            data: {
                recruiterId: recruiter.id,
                companyId: companyEntry.companyId,
                departmentId,
                branchId,
                companyName: recruiter.companyName ?? 'E2E Company',
                title: seedPosition.title,
                department: seedPosition.department,
                location: seedPosition.location,
                description: seedPosition.description,
                minimumYearsExperience: seedPosition.minimumYearsExperience,
                createdAt: now,
                deadline: expiresAt,
                interviewCapacity: interviewCapacities[index],
                interviewRangeStart,
                interviewRangeEnd,
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

            if (status === ApplicationStatus.INTERVIEW_SCHEDULED) {
                const slot = interviewSlot(applicationNumber);
                await prisma.interviewEvent.create({
                    data: {
                        applicationId: application.id,
                        applicantId: applicant.id,
                        recruiterId: position.recruiterId,
                        status: InterviewStatus.SLOT_CONFIRMED,
                        proposedRanges: [slot],
                        confirmedStart: new Date(slot.startTime),
                        confirmedEnd: new Date(slot.endTime),
                        meetingLink: `https://meet.google.com/skz-e2e-${String(
                            applicationNumber
                        ).padStart(3, '0')}`,
                        unmaskedAt: new Date(),
                    },
                });
            }

            await notifyApplicationStatus(application.id, status);
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
    console.log(`Recruiters: ${RECRUITERS.length + 2} (6 approved, 1 pending, 1 rejected)`);
    console.log(`Admin: ${ADMIN_EMAIL}`);
    console.log(`Positions: ${POSITIONS.length} (expire in ${deadlineMinutes} minutes at ${expiresAt.toISOString()})`);
    console.log(`Applicants: ${APPLICANTS.length}`);
    console.log('Applications: 45 total');
    console.log('  - Cloud Infrastructure Engineer: 15');
    console.log('  - Backend Developer: 10');
    console.log('  - Platform Engineer: 20');
    console.log('Applicants with two applications: 10 (applicants 16-25)');
    console.log('All accounts use password:', TEST_PASSWORD);
    console.log(`Recruiter login: ${RECRUITERS[0].email}`);
    console.log(`Pending company login: ${PENDING_RECRUITER_EMAIL}`);
    console.log(`Rejected company login: ${REJECTED_RECRUITER_EMAIL}`);
    console.log(`Admin login: ${ADMIN_EMAIL}`);
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
    console.log(`Recruiters: ${RECRUITERS.length + 2} (6 approved, 1 pending, 1 rejected)`);
    console.log(`Positions: ${result.positions.length} (deadline ${result.expiresAt.toISOString()})`);
    console.log(`Applicants: ${result.applicants.length}`);
    console.log(`Applications: ${result.totalApplications}`);
    console.log('All E2E accounts use password:', TEST_PASSWORD);
    console.log(`Recruiter login: ${RECRUITERS[0].email}`);
    console.log(`Pending company login: ${PENDING_RECRUITER_EMAIL}`);
    console.log(`Rejected company login: ${REJECTED_RECRUITER_EMAIL}`);
    console.log(`Admin login: ${ADMIN_EMAIL}`);
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
