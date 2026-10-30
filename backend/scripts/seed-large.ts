import 'dotenv/config';
import { existsSync } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
    ApplicationStatus,
    CompanyEventType,
    CompanyStatus,
    InterviewStatus,
    PositionStatus,
    PrismaClient,
    Role,
    SubscriptionTier,
} from '@prisma/client';
import { notifyApplicationStatus } from '../src/services/messages.js';
import {
    ADMIN_EMAILS,
    APPLICANTS,
    COMPANIES,
    POSITIONS,
    RECRUITERS,
    RECRUITER_SLOTS_PER_POSITION,
    SEED_PLAN,
    TEST_DOMAIN,
    TEST_PASSWORD,
    buildApplicationPlan,
    deadlineOffsetFor,
    statusForSlot,
    unmetMandatoryFor,
    type ApplicantSeed,
    type PositionSeed,
} from './seed-large-data.js';

const envPath = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend/.env'),
].find(existsSync);

if (envPath) {
    dotenv.config({ path: envPath });
}

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verifyApiRequested = args.includes('--verify');

const API_BASE = 'http://localhost:4000/api/v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const APPLIED_AT_WINDOW_DAYS = 14;
const INTERVIEW_RANGE_START_DAYS = 1;
const INTERVIEW_LEAD_DAYS = 2;
const INTERVIEW_START_HOUR = 10;
const INTERVIEW_WINDOW_DAYS = 7;
const MAX_DEADLINE_DAYS = 30;

const RECRUITER_SLOT_TIMES = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
    { dayOfWeek: 3, startTime: '14:00', endTime: '17:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '12:00' },
] as const;

const EXPECTED_DEADLINE_OFFSETS = [
    1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 30,
] as const;

// Positions per company, in COMPANIES order:
// Atlas Cloud, Numidia Systems, Tell Platform, Sahara Fintech, and the two
// pending companies (which have no positions).
const EXPECTED_POSITIONS_PER_COMPANY = [7, 3, 3, 3, 0, 0] as const;

const EXPECTED_ANONYMOUS_IDS = Array.from(
    { length: 100 },
    (_, index) => `DZ-L${String(index + 1).padStart(4, '0')}`
);

type CreatedApplicant = {
    id: string;
    profileId: string;
};

type CreatedCompany = {
    id: string;
    name: string;
    departments: Map<string, string>;
    branches: Map<string, string>;
};

type CreatedPosition = {
    id: string;
    recruiterId: string;
    deadline: Date;
    seed: PositionSeed;
};

type CreatedApplication = {
    id: string;
    applicantId: string;
    positionIndex: number;
    status: ApplicationStatus;
};

type SeedResult = {
    seededAt: Date;
    positions: CreatedPosition[];
};

type AuditJson = {
    category?: string;
    mandatoryCriteriaAudit?: Array<{
        criterion?: string;
        satisfied?: boolean;
    }>;
    descriptionAudit?: { gaps?: string[] };
    experienceAudit?: {
        targetYears?: number;
        provenYears?: number;
        score?: number;
    };
    strengths?: string[];
    unmetRequirements?: string[];
};

type GapJson = {
    verifiedStrengths?: string[];
    descriptionGaps?: string[];
};

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function arraysEqual<T>(actual: readonly T[], expected: readonly T[]): boolean {
    return (
        actual.length === expected.length &&
        actual.every((value, index) => value === expected[index])
    );
}

/**
 * The applicants with a second application keep the profile derived from
 * their first one. Their first-position skills plus generic padding must still
 * leave at least two mandatory criteria unmet on the second position so the
 * second application is legitimately rejected.
 */
function assertSecondApplicationsRejected(): void {
    const plan = buildApplicationPlan();
    const applicationsPerPosition = new Map<number, number>();
    const applicationsPerApplicant = new Map<
        number,
        Array<{ positionIndex: number; slotIndex: number }>
    >();

    for (const entry of plan) {
        applicationsPerPosition.set(
            entry.positionIndex,
            (applicationsPerPosition.get(entry.positionIndex) ?? 0) + 1
        );
        const entries = applicationsPerApplicant.get(entry.applicantIndex) ?? [];
        entries.push(entry);
        applicationsPerApplicant.set(entry.applicantIndex, entries);
    }

    for (const [applicantIndex, entries] of applicationsPerApplicant) {
        if (entries.length < 2) continue;
        const second = entries[1];
        const status = statusForSlot(
            second.slotIndex,
            applicationsPerPosition.get(second.positionIndex) ?? 0
        );
        const unmet = unmetMandatoryFor(
            second.positionIndex,
            APPLICANTS[applicantIndex].skills
        );

        assert(
            status === 'REJECTED',
            `Applicant ${applicantIndex + 1}'s second application to ` +
                `"${POSITIONS[second.positionIndex].title}" must be rejected, ` +
                `got ${status}`
        );
        assert(
            unmet.length >= 2,
            `Applicant ${applicantIndex + 1}'s second application to ` +
                `"${POSITIONS[second.positionIndex].title}" only leaves ` +
                `${unmet.length} mandatory criteria unmet; expected at least 2`
        );
    }
}

function provenYearsSince(startDate: string, asOf: Date): number {
    const match = /^(\d{4})-(\d{2})/.exec(startDate);
    assert(match, `Invalid experience start date "${startDate}"`);
    const startYear = Number(match[1]);
    const startMonth = Number(match[2]) - 1;
    const months =
        (asOf.getUTCFullYear() - startYear) * 12 +
        (asOf.getUTCMonth() - startMonth);
    return Math.max(0, Math.round((months / 12) * 10) / 10);
}

function auditFor(
    position: PositionSeed,
    skills: readonly string[],
    experienceStartDate: string,
    asOf: Date
) {
    const { mandatoryCriteria, preferredCriteria } = position.rubric;
    const satisfied = mandatoryCriteria.filter((criterion) =>
        skills.includes(criterion)
    );
    const unmet = mandatoryCriteria.filter(
        (criterion) => !skills.includes(criterion)
    );

    const mandatoryCriteriaAudit = mandatoryCriteria.map((criterion) => {
        const isSatisfied = skills.includes(criterion);
        return {
            criterion,
            satisfied: isSatisfied,
            evidenceFound:
                isSatisfied ?
                    `Verified qualification for ${criterion}`
                :   null,
        };
    });

    const rubricScore =
        mandatoryCriteria.length > 0 ?
            Math.round((satisfied.length / mandatoryCriteria.length) * 100)
        :   100;

    const preferredMatches = preferredCriteria.filter((criterion) =>
        skills.includes(criterion)
    );
    const descriptionTotal =
        mandatoryCriteria.length + preferredCriteria.length;
    const descriptionScore =
        descriptionTotal > 0 ?
            Math.round(
                ((satisfied.length + preferredMatches.length) /
                    descriptionTotal) *
                    100
            )
        :   100;

    const targetYears = position.minimumYearsExperience;
    const provenYears = provenYearsSince(experienceStartDate, asOf);
    const experienceRatio =
        targetYears > 0 ? Math.min(1, provenYears / targetYears) : 1;
    const experienceScore = Math.round(experienceRatio * 100);
    const matchScore = Math.round(
        0.7 * rubricScore + 0.2 * descriptionScore + 0.1 * experienceScore
    );

    return {
        matchScore,
        rubricScore,
        category:
            unmet.length === 0 ? 'ELIGIBLE'
            : unmet.length === 1 ? 'NEEDS_REVIEW'
            : 'REDIRECTED',
        mandatoryCriteriaAudit,
        descriptionAudit: {
            score: descriptionScore,
            strengths: satisfied.map(
                (criterion) => `Portfolio evidence demonstrates ${criterion}.`
            ),
            gaps: unmet.map(
                (criterion) => `No direct portfolio evidence for ${criterion}.`
            ),
            rationale:
                'Description alignment was scored against the seeded portfolio.',
        },
        experienceAudit: {
            targetYears,
            provenYears,
            score: experienceScore,
            rationale: `Proven ${provenYears} years against a preferred ${targetYears}-year target; this is a soft signal.`,
        },
        strengths: satisfied,
        unmetRequirements: unmet,
    };
}

type RubricAudit = ReturnType<typeof auditFor>;

function gapFor(position: PositionSeed, audit: RubricAudit) {
    const unmet = audit.unmetRequirements;
    const verifiedStrengths = audit.strengths;
    const provenYears = audit.experienceAudit.provenYears;
    const focus = unmet[0] ?? 'the missing requirement';

    const letter = `Dear candidate,

Thank you for applying for ${position.title}. Your application demonstrated relevant strengths in ${verifiedStrengths.join(', ') || 'several areas'}. However, this was a competitive cohort, and other candidates demonstrated stronger coverage of the mandatory requirements for this particular role.

The main gap for this posting was ${unmet.join(' and ')}. The review did not find sufficient verifiable proof of that capability in the submitted materials.

To strengthen future applications, focus on producing concrete artifacts related to the missing requirement, such as the project or certification path outlined below. Once that evidence is attached to your profile, you are encouraged to apply again.

Skillora Talent Team`;

    return {
        letter,
        verifiedStrengths,
        unmetMandatoryReasons: unmet.map(
            (criterion) => `Missing mandatory requirement: ${criterion}`
        ),
        descriptionGaps: audit.descriptionAudit.gaps,
        experienceNote: `Proven ${provenYears} years against a preferred ${position.minimumYearsExperience}-year target; this is a soft signal.`,
        recommendedBridgePath: {
            title: `Build verifiable proof for ${focus}`,
            actionableMilestones: [
                `Ship a small project that demonstrates ${focus} in production conditions.`,
                'Document the design decisions and measurable outcome in a public repository.',
                `Complete a recognized assessment or certification covering ${focus} when one is available.`,
                'Attach the artifact or credential to your profile before applying again.',
            ],
            reapplicationReadinessMilestone: `Publish the ${focus} artifact and link it from the next application.`,
        },
    };
}

function interviewSlotFor(deadline: Date): {
    startTime: string;
    endTime: string;
    format: 'video_meet';
} {
    const start = new Date(deadline.getTime() + INTERVIEW_LEAD_DAYS * DAY_MS);
    start.setHours(INTERVIEW_START_HOUR, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    return {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        format: 'video_meet',
    };
}

function printPlan(): void {
    console.log('\nLarge seed plan');
    console.log('------------------------------------------------------------');
    console.log(`Admins: ${SEED_PLAN.admins}`);
    console.log(
        `Recruiters: ${SEED_PLAN.recruiters} across ${SEED_PLAN.companies} companies ` +
            `(${SEED_PLAN.approvedCompanies} approved, ${SEED_PLAN.pendingCompanies} pending)`
    );
    console.log(`Positions: ${SEED_PLAN.positions}`);
    console.log(`Applicants: ${SEED_PLAN.applicants}`);
    console.log(
        `Applications: ${SEED_PLAN.applications} ` +
            `(${SEED_PLAN.scheduledInterviews} scheduled, ${SEED_PLAN.needsReview} needs review, ` +
            `${SEED_PLAN.onHold} on hold, ${SEED_PLAN.rejected} rejected)`
    );
    console.log(
        `Applicants with applications: ${SEED_PLAN.applicantsWithApplications} ` +
            `(${SEED_PLAN.applicantsWithTwoApplications} with two), ` +
            `without applications: ${SEED_PLAN.applicantsWithoutApplications}`
    );
    console.log(
        `Positions with seven applications: ${SEED_PLAN.positionsWithSevenApplications}; ` +
            `with six: ${SEED_PLAN.positionsWithSixApplications}`
    );
    console.log(
        `Deadlines: ${deadlineOffsetFor(0)} to ${Math.min(
            MAX_DEADLINE_DAYS,
            deadlineOffsetFor(POSITIONS.length - 1)
        )} days out`
    );
    console.log('All accounts use password:', TEST_PASSWORD);
    console.log(`Admin login: ${ADMIN_EMAILS[0]}`);
    console.log(`Recruiter login: ${RECRUITERS[0].email}`);
    console.log(`Applicant login: ${APPLICANTS[0].email}`);
    console.log('------------------------------------------------------------');
}

async function createApplicant(
    seed: ApplicantSeed,
    passwordHash: string
): Promise<CreatedApplicant> {
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
                    degree: seed.education.degree,
                    institution: seed.education.institution,
                    field: seed.education.field,
                    startDate: seed.education.startDate,
                    endDate: seed.education.endDate,
                },
            }),
            prisma.vaultExperience.create({
                data: {
                    userId: user.id,
                    company: seed.experience.company,
                    role: seed.experience.role,
                    location: seed.experience.location,
                    startDate: seed.experience.startDate,
                    endDate: seed.experience.endDate,
                    highlights: seed.experience.highlights,
                },
            }),
            prisma.vaultProject.create({
                data: {
                    userId: user.id,
                    title: seed.project.title,
                    projectUrl: seed.project.projectUrl,
                    description: seed.project.description,
                    date: seed.project.date,
                    narratives: [
                        {
                            label: 'Challenge',
                            text: seed.project.narratives.challenge,
                        },
                        {
                            label: 'Action',
                            text: seed.project.narratives.action,
                        },
                        {
                            label: 'Result',
                            text: seed.project.narratives.result,
                        },
                    ],
                    tags: seed.project.tags,
                },
            }),
            prisma.vaultCertification.create({
                data: {
                    userId: user.id,
                    name: seed.certification.name,
                    issuer: seed.certification.issuer,
                    issueDate: seed.certification.issueDate,
                    credentialId: seed.certification.credentialId,
                },
            }),
            prisma.vaultLink.create({
                data: {
                    userId: user.id,
                    label: seed.link.label,
                    url: seed.link.url,
                    type: seed.link.type,
                },
            }),
        ]);

    const profile = await prisma.applicantProfile.create({
        data: {
            userId: user.id,
            title: `${seed.title} Resume`,
            summary: seed.summary,
            skills: seed.skills,
            selectedEducationIds: [education.id],
            selectedExperienceIds: [experience.id],
            selectedProjectIds: [project.id],
            selectedCertificationIds: [certification.id],
            selectedLinkIds: [link.id],
        },
    });

    return { id: user.id, profileId: profile.id };
}

async function seed(): Promise<SeedResult> {
    assert(
        RECRUITER_SLOT_TIMES.length === RECRUITER_SLOTS_PER_POSITION,
        `Expected ${RECRUITER_SLOTS_PER_POSITION} recruiter slot templates`
    );
    assertSecondApplicationsRejected();

    console.log('Removing previous test users from', TEST_DOMAIN, '...');
    const removed = await prisma.user.deleteMany({
        where: { email: { endsWith: TEST_DOMAIN } },
    });
    console.log(
        `Removed ${removed.count} existing test users and their cascaded data.`
    );

    const now = new Date();
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    const admins = [];
    for (const [index, email] of ADMIN_EMAILS.entries()) {
        admins.push(
            await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    firstName: index === 0 ? 'Skillora' : 'Platform',
                    lastName: 'Admin',
                    role: Role.ADMIN,
                },
            })
        );
    }
    const admin = admins[0];
    console.log(`Created ${admins.length} admins`);

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
                role: Role.RECRUITER,
                subscriptionTier: SubscriptionTier.ENTERPRISE,
            },
        });
        recruiters.push(recruiter);
    }

    const companyByIndex: CreatedCompany[] = [];
    for (const seedCompany of COMPANIES) {
        const approved = seedCompany.status === CompanyStatus.APPROVED;
        const owner = recruiters[seedCompany.recruiterIndexes[0]];

        const company = await prisma.company.create({
            data: {
                name: seedCompany.name,
                employeeCount: seedCompany.employeeCount,
                industry: seedCompany.industry,
                website: seedCompany.website,
                description: seedCompany.description,
                status: seedCompany.status,
                ownerId: owner.id,
                submittedAt: now,
                reviewedAt: approved ? now : null,
                reviewedById: approved ? admin.id : null,
                departments: {
                    create: seedCompany.departments.map((name) => ({ name })),
                },
                branches: {
                    create: seedCompany.branches.map((branch) => ({
                        label: branch.label,
                        wilaya: branch.wilaya,
                        address: branch.address,
                        isHeadquarters: branch.isHeadquarters,
                    })),
                },
            },
            include: { departments: true, branches: true },
        });

        await prisma.companyEvent.create({
            data: {
                companyId: company.id,
                adminId: approved ? admin.id : null,
                type:
                    approved ?
                        CompanyEventType.APPROVED
                    :   CompanyEventType.SUBMITTED,
                note:
                    approved ?
                        'Seeded approved company.'
                    :   'Seeded pending company awaiting review.',
            },
        });

        companyByIndex.push({
            id: company.id,
            name: company.name,
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

    for (const [index, seedRecruiter] of RECRUITERS.entries()) {
        const company = companyByIndex[seedRecruiter.companyIndex];
        await prisma.user.update({
            where: { id: recruiters[index].id },
            data: { companyId: company.id, companyName: company.name },
        });
    }
    console.log(
        `Created ${companyByIndex.length} companies and linked ${RECRUITERS.length} recruiters`
    );

    const createdPositions: CreatedPosition[] = [];
    for (const [index, seedPosition] of POSITIONS.entries()) {
        const company = companyByIndex[seedPosition.companyIndex];
        const recruiter = recruiters[seedPosition.recruiterIndex];
        const departmentId = company.departments.get(seedPosition.department);
        const branchId = company.branches.get(seedPosition.branchLabel);

        assert(
            departmentId,
            `Missing department "${seedPosition.department}" on ${company.name}`
        );
        assert(
            branchId,
            `Missing branch "${seedPosition.branchLabel}" on ${company.name}`
        );

        const deadline = new Date(
            now.getTime() + deadlineOffsetFor(index) * DAY_MS
        );
        const postedAt = new Date(
            now.getTime() -
                APPLIED_AT_WINDOW_DAYS * DAY_MS -
                index * 60 * 60 * 1000
        );

        const position = await prisma.position.create({
            data: {
                recruiterId: recruiter.id,
                companyId: company.id,
                departmentId,
                branchId,
                companyName: company.name,
                title: seedPosition.title,
                department: seedPosition.department,
                location: seedPosition.location,
                description: seedPosition.description,
                minimumYearsExperience: seedPosition.minimumYearsExperience,
                createdAt: postedAt,
                deadline,
                interviewCapacity: seedPosition.interviewCapacity,
                interviewRangeStart: new Date(
                    deadline.getTime() + INTERVIEW_RANGE_START_DAYS * DAY_MS
                ),
                interviewRangeEnd: new Date(
                    deadline.getTime() + INTERVIEW_WINDOW_DAYS * DAY_MS
                ),
                status: PositionStatus.OPEN,
                rubric: seedPosition.rubric,
            },
        });

        await prisma.recruiterSlot.createMany({
            data: RECRUITER_SLOT_TIMES.map((slot) => ({
                positionId: position.id,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
            })),
        });

        createdPositions.push({
            id: position.id,
            recruiterId: recruiter.id,
            deadline,
            seed: seedPosition,
        });
    }
    console.log(
        `Created ${createdPositions.length} positions with ` +
            `${createdPositions.length * RECRUITER_SLOTS_PER_POSITION} recruiter slots`
    );

    const applicants: CreatedApplicant[] = [];
    for (const [index, seedApplicant] of APPLICANTS.entries()) {
        applicants.push(await createApplicant(seedApplicant, passwordHash));

        if ((index + 1) % 25 === 0) {
            console.log(`Created ${index + 1}/${APPLICANTS.length} applicants`);
        }
    }

    const plan = buildApplicationPlan();
    const applicationsPerPosition = new Map<number, number>();
    for (const entry of plan) {
        applicationsPerPosition.set(
            entry.positionIndex,
            (applicationsPerPosition.get(entry.positionIndex) ?? 0) + 1
        );
    }

    const applications: CreatedApplication[] = [];
    for (const [index, entry] of plan.entries()) {
        const applicationNumber = index + 1;
        const position = createdPositions[entry.positionIndex];
        const applicant = applicants[entry.applicantIndex];
        const status = statusForSlot(
            entry.slotIndex,
            applicationsPerPosition.get(entry.positionIndex) ?? 0
        );
        const applicantSeed = APPLICANTS[entry.applicantIndex];
        const audit = auditFor(
            position.seed,
            applicantSeed.skills,
            applicantSeed.experience.startDate,
            now
        );
        const appliedAt = new Date(
            now.getTime() -
                APPLIED_AT_WINDOW_DAYS * DAY_MS +
                Math.floor(
                    (APPLIED_AT_WINDOW_DAYS *
                        DAY_MS *
                        applicationNumber) /
                        (plan.length + 1)
                )
        );

        const application = await prisma.application.create({
            data: {
                positionId: position.id,
                applicantId: applicant.id,
                profileId: applicant.profileId,
                anonymousId: `DZ-L${String(applicationNumber).padStart(4, '0')}`,
                status,
                matchScore: audit.matchScore,
                rubricAudit: audit,
                gapAnalysis:
                    status === ApplicationStatus.REJECTED ?
                        gapFor(position.seed, audit)
                    :   undefined,
                appliedAt,
            },
        });

        applications.push({
            id: application.id,
            applicantId: applicant.id,
            positionIndex: entry.positionIndex,
            status,
        });
    }
    console.log(`Created ${applications.length} applications`);

    let interviewCount = 0;
    for (const application of applications) {
        if (application.status !== ApplicationStatus.INTERVIEW_SCHEDULED) {
            continue;
        }

        const position = createdPositions[application.positionIndex];
        const slot = interviewSlotFor(position.deadline);
        interviewCount += 1;

        await prisma.interviewEvent.create({
            data: {
                applicationId: application.id,
                applicantId: application.applicantId,
                recruiterId: position.recruiterId,
                status: InterviewStatus.SLOT_CONFIRMED,
                proposedRanges: [slot],
                confirmedStart: new Date(slot.startTime),
                confirmedEnd: new Date(slot.endTime),
                meetingLink: `https://meet.google.com/skz-large-${String(
                    interviewCount
                ).padStart(4, '0')}`,
                unmaskedAt: now,
            },
        });
    }
    console.log(`Created ${interviewCount} interview events`);

    for (const application of applications) {
        await notifyApplicationStatus(application.id, application.status);
    }
    console.log(`Sent ${applications.length} applicant notifications`);

    return { seededAt: now, positions: createdPositions };
}

async function verifyDatabase(seededAt: Date): Promise<void> {
    const domain = TEST_DOMAIN;
    const testUser = { email: { endsWith: domain } };

    const [
        admins,
        recruiters,
        applicants,
        approvedCompanies,
        pendingCompanies,
        positions,
        applications,
        interviews,
        messages,
    ] = await Promise.all([
        prisma.user.count({
            where: { ...testUser, role: 'ADMIN' },
        }),
        prisma.user.count({
            where: { ...testUser, role: 'RECRUITER' },
        }),
        prisma.user.count({
            where: { ...testUser, role: 'APPLICANT' },
        }),
        prisma.company.count({
            where: { status: 'APPROVED', owner: testUser },
        }),
        prisma.company.count({
            where: { status: 'PENDING', owner: testUser },
        }),
        prisma.position.count({
            where: { recruiter: testUser },
        }),
        prisma.application.count({
            where: { applicant: testUser },
        }),
        prisma.interviewEvent.count({
            where: { applicant: testUser },
        }),
        prisma.message.count({
            where: { user: testUser },
        }),
    ]);

    assert(admins === 2, `Expected 2 admins, got ${admins}`);
    assert(recruiters === 8, `Expected 8 recruiters, got ${recruiters}`);
    assert(applicants === 100, `Expected 100 applicants, got ${applicants}`);
    assert(
        approvedCompanies === 4,
        `Expected 4 approved companies, got ${approvedCompanies}`
    );
    assert(
        pendingCompanies === 2,
        `Expected 2 pending companies, got ${pendingCompanies}`
    );
    assert(positions === 16, `Expected 16 positions, got ${positions}`);
    assert(
        applications === 100,
        `Expected 100 applications, got ${applications}`
    );
    assert(
        interviews === 16,
        `Expected 16 interview events, got ${interviews}`
    );
    assert(
        messages === 100,
        `Expected 100 applicant notifications, got ${messages}`
    );

    const atlas = await prisma.company.findFirst({
        where: { name: 'Atlas Cloud', owner: testUser },
        include: { _count: { select: { members: true } } },
    });
    assert(
        atlas?._count.members === 3,
        `Atlas Cloud should have 3 members, got ${atlas?._count.members ?? 0}`
    );

    const applicantsWithoutApplications = await prisma.user.count({
        where: {
            ...testUser,
            role: 'APPLICANT',
            applications: { none: {} },
        },
    });
    assert(
        applicantsWithoutApplications === 5,
        `Expected 5 applicants without applications, ` +
            `got ${applicantsWithoutApplications}`
    );

    const applicationsPerApplicant = await prisma.application.groupBy({
        by: ['applicantId'],
        where: { applicant: testUser },
        _count: { _all: true },
    });
    const applicantsWithTwoApplications = applicationsPerApplicant.filter(
        (row) => row._count._all === 2
    ).length;
    assert(
        applicantsWithTwoApplications === 5,
        `Expected 5 applicants with two applications, ` +
            `got ${applicantsWithTwoApplications}`
    );

    const applicationsPerPosition = await prisma.application.groupBy({
        by: ['positionId'],
        where: { applicant: testUser },
        _count: { _all: true },
    });
    const positionsWithSevenApplications = applicationsPerPosition.filter(
        (row) => row._count._all === 7
    ).length;
    const positionsWithSixApplications = applicationsPerPosition.filter(
        (row) => row._count._all === 6
    ).length;
    assert(
        positionsWithSevenApplications === 4,
        `Expected 4 positions with seven applications, ` +
            `got ${positionsWithSevenApplications}`
    );
    assert(
        positionsWithSixApplications === 12,
        `Expected 12 positions with six applications, ` +
            `got ${positionsWithSixApplications}`
    );

    const statusCounts = await prisma.application.groupBy({
        by: ['status'],
        where: { applicant: testUser },
        _count: { _all: true },
    });
    const countStatus = (status: ApplicationStatus) =>
        statusCounts.find((row) => row.status === status)?._count._all ?? 0;
    const scheduled = countStatus(ApplicationStatus.INTERVIEW_SCHEDULED);
    const needsReview = countStatus(ApplicationStatus.NEEDS_REVIEW);
    const onHold = countStatus(ApplicationStatus.ON_HOLD);
    const rejectedCount = countStatus(ApplicationStatus.REJECTED);

    assert(
        scheduled === 16,
        `Expected 16 scheduled applications, got ${scheduled}`
    );
    assert(
        needsReview === 20,
        `Expected 20 applications needing review, got ${needsReview}`
    );
    assert(onHold === 16, `Expected 16 applications on hold, got ${onHold}`);
    assert(
        rejectedCount === 48,
        `Expected 48 rejected applications, got ${rejectedCount}`
    );

    const auditedApplications = await prisma.application.findMany({
        where: { applicant: testUser },
        select: {
            anonymousId: true,
            status: true,
            rubricAudit: true,
            gapAnalysis: true,
            profile: { select: { skills: true } },
        },
    });
    assert(
        auditedApplications.length === applications,
        `Expected ${applications} audited applications, ` +
            `got ${auditedApplications.length}`
    );

    for (const row of auditedApplications) {
        const skills = row.profile.skills;
        const audit = row.rubricAudit as unknown as AuditJson | null;
        assert(audit, `${row.anonymousId} must have a rubric audit`);

        const criteria = audit.mandatoryCriteriaAudit ?? [];
        assert(
            criteria.length > 0,
            `${row.anonymousId} rubric audit must list mandatory criteria`
        );

        for (const entry of criteria) {
            assert(
                entry.criterion,
                `${row.anonymousId} rubric audit contains an unnamed criterion`
            );
            if (entry.satisfied) {
                assert(
                    skills.includes(entry.criterion),
                    `${row.anonymousId} marks "${entry.criterion}" satisfied, ` +
                        `but profile skills are [${skills.join(', ')}]`
                );
            }
        }

        const unmet = audit.unmetRequirements ?? [];
        const unsatisfied = criteria
            .filter((entry) => !entry.satisfied)
            .map((entry) => entry.criterion as string);
        assert(
            arraysEqual(unmet, unsatisfied),
            `${row.anonymousId} unmetRequirements [${unmet.join(', ')}] must ` +
                `match unsatisfied criteria [${unsatisfied.join(', ')}]`
        );

        const expectedUnmet =
            row.status === ApplicationStatus.INTERVIEW_SCHEDULED ||
            row.status === ApplicationStatus.ON_HOLD ? 0
            : row.status === ApplicationStatus.NEEDS_REVIEW ? 1
            : 2;
        if (row.status === ApplicationStatus.REJECTED) {
            assert(
                unmet.length >= expectedUnmet,
                `${row.anonymousId} is rejected with ${unmet.length} unmet ` +
                    `criteria [${unmet.join(', ')}]; expected at least ${expectedUnmet}`
            );
        } else {
            assert(
                unmet.length === expectedUnmet,
                `${row.anonymousId} is ${row.status} with ${unmet.length} ` +
                    `unmet criteria [${unmet.join(', ')}]; expected ${expectedUnmet}`
            );
        }

        const expectedCategory =
            unmet.length === 0 ? 'ELIGIBLE'
            : unmet.length === 1 ? 'NEEDS_REVIEW'
            : 'REDIRECTED';
        assert(
            audit.category === expectedCategory,
            `${row.anonymousId} category is ${audit.category}; expected ` +
                `${expectedCategory} for ${unmet.length} unmet criteria`
        );

        const auditDescriptionGaps = audit.descriptionAudit?.gaps ?? [];
        assert(
            arraysEqual(
                auditDescriptionGaps,
                unmet.map(
                    (criterion) =>
                        `No direct portfolio evidence for ${criterion}.`
                )
            ),
            `${row.anonymousId} description gaps ` +
                `[${auditDescriptionGaps.join(' | ')}] must match unmet ` +
                `criteria [${unmet.join(', ')}]`
        );

        const experienceAudit = audit.experienceAudit;
        assert(
            experienceAudit,
            `${row.anonymousId} rubric audit must include an experience audit`
        );
        const provenYears = experienceAudit.provenYears;
        const targetYears = experienceAudit.targetYears;
        const experienceScore = experienceAudit.score;
        assert(
            provenYears !== undefined &&
                targetYears !== undefined &&
                experienceScore !== undefined,
            `${row.anonymousId} experience audit must include proven years, ` +
                `target years, and a score`
        );
        const experienceRatio =
            targetYears > 0 ? Math.min(1, provenYears / targetYears) : 1;
        assert(
            experienceScore === Math.round(experienceRatio * 100),
            `${row.anonymousId} experience score ${experienceScore} must ` +
                `equal proven/target ratio ${provenYears}/${targetYears}`
        );

        if (row.status !== ApplicationStatus.REJECTED) continue;

        const gap = row.gapAnalysis as unknown as GapJson | null;
        assert(gap, `${row.anonymousId} is rejected without gap analysis`);

        const verifiedStrengths = gap.verifiedStrengths ?? [];
        for (const strength of verifiedStrengths) {
            assert(
                skills.includes(strength),
                `${row.anonymousId} gap cites "${strength}" as a verified ` +
                    `strength, but profile skills are [${skills.join(', ')}]`
            );
        }
        assert(
            arraysEqual(verifiedStrengths, audit.strengths ?? []),
            `${row.anonymousId} gap verified strengths ` +
                `[${verifiedStrengths.join(', ')}] must match audit strengths ` +
                `[${(audit.strengths ?? []).join(', ')}]`
        );
        assert(
            arraysEqual(gap.descriptionGaps ?? [], auditDescriptionGaps),
            `${row.anonymousId} gap description gaps must match the rubric audit`
        );
    }

    const deadlines = await prisma.position.findMany({
        where: { recruiter: testUser },
        select: { deadline: true },
        orderBy: { deadline: 'asc' },
    });
    const now = Date.now();
    assert(
        deadlines.length === 16 &&
            deadlines.every((row) => row.deadline.getTime() > now),
        'All position deadlines must be in the future'
    );
    assert(
        deadlines[0].deadline.getTime() - now < 2 * DAY_MS,
        'The earliest position deadline should be about one day out'
    );
    assert(
        deadlines[deadlines.length - 1].deadline.getTime() - now >
            (MAX_DEADLINE_DAYS - 1) * DAY_MS,
        `The latest position deadline should be about ${MAX_DEADLINE_DAYS} days out`
    );

    const deadlineOffsets = deadlines.map((row) =>
        Math.round((row.deadline.getTime() - seededAt.getTime()) / DAY_MS)
    );
    assert(
        arraysEqual(deadlineOffsets, EXPECTED_DEADLINE_OFFSETS),
        `Expected deadline offsets ${EXPECTED_DEADLINE_OFFSETS.join(',')}, ` +
            `got ${deadlineOffsets.join(',')}`
    );

    const positionsByCompany = await prisma.position.findMany({
        where: { recruiter: testUser },
        select: { company: { select: { name: true } } },
    });
    const positionCountsByCompanyName = new Map<string, number>();
    for (const row of positionsByCompany) {
        const companyName = row.company?.name;
        if (!companyName) continue;
        positionCountsByCompanyName.set(
            companyName,
            (positionCountsByCompanyName.get(companyName) ?? 0) + 1
        );
    }
    const positionsPerCompany = COMPANIES.map(
        (company) => positionCountsByCompanyName.get(company.name) ?? 0
    );
    assert(
        arraysEqual(positionsPerCompany, EXPECTED_POSITIONS_PER_COMPANY),
        `Expected positions per company ${EXPECTED_POSITIONS_PER_COMPANY.join(',')}, ` +
            `got ${positionsPerCompany.join(',')}`
    );

    const slotsPerPosition = await prisma.recruiterSlot.groupBy({
        by: ['positionId'],
        where: { position: { recruiter: testUser } },
        _count: { _all: true },
    });
    assert(
        slotsPerPosition.length === 16 &&
            slotsPerPosition.every(
                (row) => row._count._all === RECRUITER_SLOTS_PER_POSITION
            ),
        `Expected ${RECRUITER_SLOTS_PER_POSITION} recruiter slots for each of 16 positions`
    );

    const interviewPositions = await prisma.position.findMany({
        where: { recruiter: testUser },
        select: {
            title: true,
            deadline: true,
            interviewRangeStart: true,
            interviewRangeEnd: true,
            applications: {
                where: { status: 'INTERVIEW_SCHEDULED' },
                select: {
                    interviewEvent: {
                        select: {
                            confirmedStart: true,
                            confirmedEnd: true,
                        },
                    },
                },
            },
        },
    });
    assert(
        interviewPositions.length === 16,
        `Expected 16 seeded positions, got ${interviewPositions.length}`
    );

    for (const position of interviewPositions) {
        const rangeStart = position.interviewRangeStart;
        const rangeEnd = position.interviewRangeEnd;
        assert(
            rangeStart && rangeEnd,
            `"${position.title}" interview window must have a start and an end`
        );
        assert(
            rangeStart.getTime() ===
                position.deadline.getTime() +
                    INTERVIEW_RANGE_START_DAYS * DAY_MS,
            `"${position.title}" interviewRangeStart must be deadline + ` +
                `${INTERVIEW_RANGE_START_DAYS} day, got ` +
                `${rangeStart.toISOString()} for deadline ` +
                `${position.deadline.toISOString()}`
        );
        assert(
            rangeEnd.getTime() ===
                position.deadline.getTime() + INTERVIEW_WINDOW_DAYS * DAY_MS,
            `"${position.title}" interviewRangeEnd must be deadline + ` +
                `${INTERVIEW_WINDOW_DAYS} days, got ${rangeEnd.toISOString()} ` +
                `for deadline ${position.deadline.toISOString()}`
        );

        const scheduled = position.applications.filter(
            (application) => application.interviewEvent
        );
        assert(
            scheduled.length === 1,
            `"${position.title}" must have exactly 1 confirmed interview, ` +
                `got ${scheduled.length}`
        );

        const event = scheduled[0].interviewEvent;
        assert(
            event,
            `"${position.title}" scheduled application must have an interview`
        );
        const confirmedStart = event.confirmedStart;
        const confirmedEnd = event.confirmedEnd;
        assert(
            confirmedStart && confirmedEnd,
            `"${position.title}" interview must have confirmed start and end times`
        );
        assert(
            confirmedStart.getHours() === INTERVIEW_START_HOUR,
            `"${position.title}" interview must start at ` +
                `${INTERVIEW_START_HOUR}:00 local time, got ` +
                `${confirmedStart.toISOString()} (local hour ` +
                `${confirmedStart.getHours()})`
        );
        assert(
            confirmedStart.getTime() > rangeStart.getTime() &&
                confirmedStart.getTime() < rangeEnd.getTime(),
            `"${position.title}" interview at ${confirmedStart.toISOString()} ` +
                `must fall inside ${rangeStart.toISOString()} – ` +
                `${rangeEnd.toISOString()}`
        );
        assert(
            confirmedEnd.getTime() - confirmedStart.getTime() ===
                60 * 60 * 1000,
            `"${position.title}" interview must last one hour, got ` +
                `${(confirmedEnd.getTime() - confirmedStart.getTime()) / 60_000} minutes`
        );
    }

    const anonymousIdRows = await prisma.application.findMany({
        where: { applicant: testUser },
        select: { anonymousId: true },
        orderBy: { anonymousId: 'asc' },
    });
    const anonymousIds = anonymousIdRows.map((row) => row.anonymousId);
    assert(
        arraysEqual(anonymousIds, EXPECTED_ANONYMOUS_IDS),
        'Application anonymous IDs must be exactly DZ-L0001 through DZ-L0100'
    );

    const appliedRows = await prisma.application.findMany({
        where: { applicant: testUser },
        select: { appliedAt: true },
    });
    const appliedAtTimes = appliedRows.map((row) => row.appliedAt.getTime());
    const earliestAppliedAt = Math.min(...appliedAtTimes);
    const latestAppliedAt = Math.max(...appliedAtTimes);
    assert(
        appliedRows.length === 100 &&
            earliestAppliedAt >=
                seededAt.getTime() - APPLIED_AT_WINDOW_DAYS * DAY_MS &&
            latestAppliedAt <= now,
        'Every application must be applied within the previous 14 days'
    );
    assert(
        earliestAppliedAt < seededAt.getTime() - 13 * DAY_MS &&
            latestAppliedAt > seededAt.getTime() - DAY_MS,
        'Applications must be spread across the previous 14 days'
    );

    console.log('\nLarge seed verification');
    console.log('------------------------------------------------------------');
    console.log(`Admins: ${admins}`);
    console.log(
        `Companies: ${approvedCompanies + pendingCompanies} ` +
            `(${approvedCompanies} approved, ${pendingCompanies} pending)`
    );
    console.log(`Recruiters: ${recruiters}`);
    console.log(`Positions: ${positions}`);
    console.log(`Applicants: ${applicants}`);
    console.log(
        `Applications: ${applications} ` +
            `(${scheduled} scheduled, ${needsReview} needs review, ` +
            `${onHold} on hold, ${rejectedCount} rejected)`
    );
    console.log(
        `Applicants without applications: ${applicantsWithoutApplications}; ` +
            `with two applications: ${applicantsWithTwoApplications}`
    );
    console.log(
        `Positions with seven applications: ${positionsWithSevenApplications}; ` +
            `with six: ${positionsWithSixApplications}`
    );
    console.log(`Interview events: ${interviews}`);
    console.log(`Applicant notifications: ${messages}`);
    console.log('------------------------------------------------------------');
    console.log('Database verification passed.');
}

async function apiLogin(email: string): Promise<string> {
    let response: Response;
    try {
        response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email, password: TEST_PASSWORD }),
        });
    } catch (error) {
        throw new Error(
            `Could not reach the API at ${API_BASE}. Start the backend or omit --verify. (${String(error)})`
        );
    }

    const body = (await response.json().catch(() => null)) as {
        accessToken?: string;
    } | null;

    if (!response.ok) {
        throw new Error(
            `login ${email}: ${response.status} ${JSON.stringify(body)}`
        );
    }

    assert(
        body?.accessToken,
        `Login response for ${email} did not include an access token`
    );
    return body.accessToken;
}

async function apiGet<T>(route: string, token?: string): Promise<T> {
    const response = await fetch(`${API_BASE}${route}`, {
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
        throw new Error(
            `GET ${route} failed (${response.status}): ${await response.text()}`
        );
    }

    return (await response.json()) as T;
}

async function verifyApi(seededPositions: CreatedPosition[]): Promise<void> {
    const admin = await apiLogin(ADMIN_EMAILS[0]);
    const seededPendingCompanies = COMPANIES.filter(
        (company) => company.status === CompanyStatus.PENDING
    ).map((company) => company.name);
    const pending = await apiGet<{ companies: Array<{ name?: string }> }>(
        '/admin/companies?status=PENDING',
        admin
    );
    const observedPendingCompanies = pending.companies.map(
        (company) => company.name ?? '(unnamed)'
    );
    const missingPendingCompanies = seededPendingCompanies.filter(
        (name) => !observedPendingCompanies.includes(name)
    );
    assert(
        missingPendingCompanies.length === 0,
        `admin must see both seeded pending companies; missing ` +
            `[${missingPendingCompanies.join(', ') || '(none)'}] from observed ` +
            `[${observedPendingCompanies.join(', ') || '(none)'}]`
    );

    const recruiter = await apiLogin(RECRUITERS[0].email);
    const positions = await apiGet<{ positions: unknown[] }>(
        '/recruiter/positions',
        recruiter
    );
    assert(
        positions.positions.length === 3,
        `recruiter1 owns 3 positions, got ${positions.positions.length}`
    );

    const pendingRecruiter = await apiLogin(RECRUITERS[6].email);
    const blocked = await fetch(`${API_BASE}/recruiter/positions`, {
        headers: { authorization: `Bearer ${pendingRecruiter}` },
    });
    assert(
        blocked.status === 403,
        `pending recruiter is blocked, got HTTP ${blocked.status}`
    );

    const applicant = await apiLogin(APPLICANTS[0].email);
    const applications = await apiGet<{ applications: unknown[] }>(
        '/applicant/applications',
        applicant
    );
    assert(
        applications.applications.length === 2,
        `applicant01 has 2 applications, got ${applications.applications.length}`
    );

    const calendar = await apiGet<{
        events: Array<{ status?: string }>;
    }>('/applicant/calendar', applicant);
    const confirmedEvents = calendar.events.filter(
        (event) => event.status === 'SLOT_CONFIRMED'
    );
    assert(
        confirmedEvents.length === 1,
        `applicant01 has exactly 1 confirmed calendar event, got ` +
            `${confirmedEvents.length} of ${calendar.events.length} ` +
            `[${calendar.events.map((event) => event.status ?? 'unknown').join(', ') || '(none)'}]`
    );

    const publicJobs = await apiGet<{ positions: Array<{ id?: string }> }>(
        '/public/positions'
    );
    const publicPositionIds = new Set(
        publicJobs.positions.map((position) => position.id ?? '')
    );
    const missingPositionIds = seededPositions
        .map((position) => position.id)
        .filter((id) => !publicPositionIds.has(id));
    assert(
        missingPositionIds.length === 0,
        `all ${seededPositions.length} seeded positions must be publicly ` +
            `visible; missing ${missingPositionIds.length} ` +
            `[${missingPositionIds.join(', ') || '(none)'}] from ` +
            `${publicJobs.positions.length} public positions`
    );

    console.log(
        'API verification passed: pending companies, recruiter ownership, ' +
            'applicant calendar, applications, and public positions all match.'
    );
}

async function main(): Promise<void> {
    printPlan();

    if (dryRun) {
        console.log('\nDry run: no database changes were made.');
        return;
    }

    const { seededAt, positions } = await seed();
    await verifyDatabase(seededAt);

    if (verifyApiRequested) {
        await verifyApi(positions);
    } else {
        console.log('\nRun with --verify to check the seeded data through the running API.');
    }
}

main()
    .catch((error) => {
        console.error('Large seed failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
