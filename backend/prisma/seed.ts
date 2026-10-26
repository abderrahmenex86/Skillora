import {
    PrismaClient,
    Prisma,
    Role,
    SubscriptionTier,
    PositionStatus,
    ApplicationStatus,
    InterviewStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type EducationSeed = {
    key: string;
    degree: string;
    institution: string;
    field: string;
    startDate: string;
    endDate: string;
};

type ExperienceSeed = {
    key: string;
    company: string;
    role: string;
    location?: string;
    startDate: string;
    endDate?: string;
    highlights: string[];
};

type ProjectSeed = {
    key: string;
    title: string;
    projectUrl?: string;
    description: string;
    date?: string;
    tags: string[];
};

type CertificationSeed = {
    key: string;
    name: string;
    issuer: string;
    issueDate: string;
    credentialId?: string;
};

type VolunteeringSeed = {
    key: string;
    organization: string;
    role: string;
    description: string;
    startDate?: string;
    endDate?: string;
};

type LanguageSeed = {
    key: string;
    name: string;
    proficiency: string;
};

type LinkSeed = {
    key: string;
    label: string;
    url: string;
    type: string;
};

type VaultSeed = {
    educations?: EducationSeed[];
    experiences?: ExperienceSeed[];
    projects?: ProjectSeed[];
    certifications?: CertificationSeed[];
    volunteering?: VolunteeringSeed[];
    languages?: LanguageSeed[];
    links?: LinkSeed[];
};

type ResumeSeed = {
    key: string;
    title: string;
    summary: string;
    skills: string[];
    education?: string[];
    experience?: string[];
    projects?: string[];
    certifications?: string[];
    volunteering?: string[];
    languages?: string[];
    links?: string[];
};

type ApplicantSeed = {
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    phone: string;
    wilaya: string;
    tier: SubscriptionTier;
    vault: VaultSeed;
    resumes: ResumeSeed[];
};

type PositionSeed = {
    key: string;
    recruiterEmail: string;
    companyName: string;
    title: string;
    department: string;
    location: string;
    deadlineDays: number;
    status: PositionStatus;
    rubric: {
        mandatoryCriteria: string[];
        preferredCriteria: string[];
        minimumScoreThreshold: number;
    };
};

type ApplicationSeed = {
    applicantEmail: string;
    profileKey: string;
    positionKey: string;
    anonymousId: string;
    status: ApplicationStatus;
    matchScore: number;
    unmet?: string[];
    gapAnalysis?: Prisma.InputJsonValue;
    interview?: boolean;
};

type VaultIds = {
    educations: Map<string, string>;
    experiences: Map<string, string>;
    projects: Map<string, string>;
    certifications: Map<string, string>;
    volunteering: Map<string, string>;
    languages: Map<string, string>;
    links: Map<string, string>;
};

type ApplicantRef = {
    id: string;
    profiles: Map<string, string>;
};

const applicantRefs = new Map<string, ApplicantRef>();
const positionRefs = new Map<string, { id: string; seed: PositionSeed }>();
const recruiterRefs = new Map<string, string>();

function daysFromNow(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

function resolveIds(
    ids: Map<string, string>,
    keys: string[] | undefined,
    label: string
): string[] {
    return (keys ?? []).map((key) => {
        const id = ids.get(key);
        if (!id) {
            throw new Error(`Unknown ${label} key: ${key}`);
        }
        return id;
    });
}

async function createVault(userId: string, vault: VaultSeed): Promise<VaultIds> {
    const ids: VaultIds = {
        educations: new Map(),
        experiences: new Map(),
        projects: new Map(),
        certifications: new Map(),
        volunteering: new Map(),
        languages: new Map(),
        links: new Map(),
    };

    for (const item of vault.educations ?? []) {
        const { key, ...data } = item;
        const created = await prisma.vaultEducation.create({
            data: { userId, ...data },
        });
        ids.educations.set(key, created.id);
    }

    for (const item of vault.experiences ?? []) {
        const { key, ...data } = item;
        const created = await prisma.vaultExperience.create({
            data: { userId, ...data },
        });
        ids.experiences.set(key, created.id);
    }

    for (const item of vault.projects ?? []) {
        const { key, description, ...data } = item;
        const created = await prisma.vaultProject.create({
            data: {
                userId,
                ...data,
                description,
                narratives: [{ label: 'Overview', text: description }],
            },
        });
        ids.projects.set(key, created.id);
    }

    for (const item of vault.certifications ?? []) {
        const { key, ...data } = item;
        const created = await prisma.vaultCertification.create({
            data: { userId, ...data },
        });
        ids.certifications.set(key, created.id);
    }

    for (const item of vault.volunteering ?? []) {
        const { key, ...data } = item;
        const created = await prisma.vaultVolunteering.create({
            data: { userId, ...data },
        });
        ids.volunteering.set(key, created.id);
    }

    for (const item of vault.languages ?? []) {
        const { key, ...data } = item;
        const created = await prisma.vaultLanguage.create({
            data: { userId, ...data },
        });
        ids.languages.set(key, created.id);
    }

    for (const item of vault.links ?? []) {
        const { key, ...data } = item;
        const created = await prisma.vaultLink.create({
            data: { userId, ...data },
        });
        ids.links.set(key, created.id);
    }

    return ids;
}

async function createApplicant(
    spec: ApplicantSeed,
    passwordHash: string
): Promise<void> {
    if (spec.resumes.length > 3) {
        throw new Error(`${spec.email} has more than 3 resumes`);
    }
    if (spec.tier === SubscriptionTier.FREE && spec.resumes.length > 1) {
        throw new Error(`${spec.email} is FREE and cannot have multiple resumes`);
    }

    const user = await prisma.user.create({
        data: {
            email: spec.email,
            passwordHash,
            firstName: spec.firstName,
            middleName: spec.middleName,
            lastName: spec.lastName,
            phone: spec.phone,
            wilaya: spec.wilaya,
            role: Role.APPLICANT,
            subscriptionTier: spec.tier,
            subscriptionExpiresAt:
                spec.tier === SubscriptionTier.PRO ? daysFromNow(60) : null,
        },
    });

    const vault = await createVault(user.id, spec.vault);
    const profiles = new Map<string, string>();

    for (const resume of spec.resumes) {
        const profile = await prisma.applicantProfile.create({
            data: {
                userId: user.id,
                title: resume.title,
                summary: resume.summary,
                skills: resume.skills,
                selectedEducationIds: resolveIds(
                    vault.educations,
                    resume.education,
                    'education'
                ),
                selectedExperienceIds: resolveIds(
                    vault.experiences,
                    resume.experience,
                    'experience'
                ),
                selectedProjectIds: resolveIds(
                    vault.projects,
                    resume.projects,
                    'project'
                ),
                selectedCertificationIds: resolveIds(
                    vault.certifications,
                    resume.certifications,
                    'certification'
                ),
                selectedVolunteeringIds: resolveIds(
                    vault.volunteering,
                    resume.volunteering,
                    'volunteering'
                ),
                selectedLanguageIds: resolveIds(
                    vault.languages,
                    resume.languages,
                    'language'
                ),
                selectedLinkIds: resolveIds(
                    vault.links,
                    resume.links,
                    'link'
                ),
            },
        });
        profiles.set(resume.key, profile.id);
    }

    applicantRefs.set(spec.email, { id: user.id, profiles });
    console.log(
        `  ${spec.firstName} ${spec.lastName} (${spec.tier}) - ${spec.resumes.length} resumes`
    );
}

async function createPosition(seed: PositionSeed): Promise<void> {
    const recruiterId = recruiterRefs.get(seed.recruiterEmail);
    if (!recruiterId) {
        throw new Error(`Missing recruiter: ${seed.recruiterEmail}`);
    }

    const position = await prisma.position.create({
        data: {
            recruiterId,
            companyName: seed.companyName,
            title: seed.title,
            department: seed.department,
            location: seed.location,
            deadline: daysFromNow(seed.deadlineDays),
            status: seed.status,
            rubric: seed.rubric,
        },
    });

    positionRefs.set(seed.key, { id: position.id, seed });
}

function buildRubricAudit(rubric: PositionSeed['rubric'], unmet: string[] = []) {
    const unmetSet = new Set(unmet);
    return {
        mandatoryCriteriaAudit: rubric.mandatoryCriteria.map((criterion) => ({
            criterion,
            satisfied: !unmetSet.has(criterion),
            evidenceFound: unmetSet.has(criterion)
                ? null
                : `Verified evidence for ${criterion}`,
        })),
        strengths: rubric.mandatoryCriteria.filter(
            (criterion) => !unmetSet.has(criterion)
        ),
        unmetRequirements: rubric.mandatoryCriteria.filter((criterion) =>
            unmetSet.has(criterion)
        ),
    };
}

async function createInterviewEvent(
    applicationId: string,
    applicantId: string,
    recruiterId: string
): Promise<void> {
    const first = new Date();
    first.setDate(first.getDate() + 3);
    first.setHours(10, 0, 0, 0);

    const second = new Date();
    second.setDate(second.getDate() + 5);
    second.setHours(14, 30, 0, 0);

    await prisma.interviewEvent.create({
        data: {
            applicationId,
            applicantId,
            recruiterId,
            status: InterviewStatus.RANGE_PENDING,
            proposedRanges: [
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
            ],
        },
    });
}

async function createApplication(seed: ApplicationSeed): Promise<void> {
    const applicant = applicantRefs.get(seed.applicantEmail);
    const position = positionRefs.get(seed.positionKey);

    if (!applicant) {
        throw new Error(`Missing applicant: ${seed.applicantEmail}`);
    }
    if (!position) {
        throw new Error(`Missing position: ${seed.positionKey}`);
    }

    const profileId = applicant.profiles.get(seed.profileKey);
    if (!profileId) {
        throw new Error(
            `Missing resume ${seed.profileKey} for ${seed.applicantEmail}`
        );
    }

    const application = await prisma.application.create({
        data: {
            positionId: position.id,
            applicantId: applicant.id,
            profileId,
            anonymousId: seed.anonymousId,
            status: seed.status,
            matchScore: seed.matchScore,
            rubricAudit: buildRubricAudit(position.seed.rubric, seed.unmet),
            gapAnalysis: seed.gapAnalysis ?? undefined,
        },
    });

    if (seed.interview) {
        const recruiterId = recruiterRefs.get(position.seed.recruiterEmail);
        if (!recruiterId) {
            throw new Error(
                `Missing recruiter for position: ${position.seed.key}`
            );
        }
        await createInterviewEvent(
            application.id,
            applicant.id,
            recruiterId
        );
    }
}

const applicants: ApplicantSeed[] = [
    {
        email: 'samy.benali@esi.dz',
        firstName: 'Samy',
        middleName: 'Abdelkader',
        lastName: 'Benali',
        phone: '+213 661 78 90 12',
        wilaya: '16 - Alger',
        tier: SubscriptionTier.FREE,
        vault: {
            educations: [
                {
                    key: 'edu',
                    degree: 'Diplôme d’Ingénieur d’État en Informatique',
                    institution: 'ESI (Ex-INI) Algiers',
                    field: 'Systèmes Informatiques Distribués',
                    startDate: '2019-09-01',
                    endDate: '2024-07-01',
                },
            ],
            experiences: [
                {
                    key: 'exp',
                    company: 'CyberTech DZ',
                    role: 'DevOps Intern',
                    location: 'Algiers',
                    startDate: '2023-06-01',
                    endDate: '2024-05-31',
                    highlights: [
                        'Automated container image builds and blue-green deployments with GitHub Actions.',
                        'Maintained Terraform modules for staging and production environments.',
                    ],
                },
            ],
            projects: [
                {
                    key: 'cloud',
                    title: 'Cloud Infrastructure Orchestrator',
                    projectUrl:
                        'https://github.com/samy-benali/cloud-infra-orchestrator',
                    description:
                        'Architected zero-downtime deployment workflows using GitHub Actions and Terraform on Alpine Linux.',
                    date: '2024-05-01',
                    tags: ['Go', 'Terraform', 'Docker', 'CI/CD'],
                },
                {
                    key: 'monitoring',
                    title: 'Kubernetes Monitoring Stack',
                    projectUrl:
                        'https://github.com/samy-benali/k8s-monitoring-stack',
                    description:
                        'Deployed Prometheus and Grafana dashboards with actionable alerts for a three-node Kubernetes cluster.',
                    date: '2024-02-01',
                    tags: ['Kubernetes', 'Prometheus', 'Grafana', 'Linux'],
                },
            ],
            certifications: [
                {
                    key: 'aws',
                    name: 'AWS Certified Cloud Practitioner',
                    issuer: 'Amazon Web Services',
                    issueDate: '2024-03-15',
                    credentialId: 'AWS-CCP-2024-0142',
                },
            ],
            languages: [
                { key: 'ar', name: 'Arabic', proficiency: 'Native' },
                { key: 'fr', name: 'French', proficiency: 'Fluent' },
                { key: 'en', name: 'English', proficiency: 'Intermediate' },
            ],
            links: [
                {
                    key: 'github',
                    label: 'GitHub',
                    url: 'https://github.com/samy-benali',
                    type: 'github',
                },
                {
                    key: 'linkedin',
                    label: 'LinkedIn',
                    url: 'https://www.linkedin.com/in/samy-benali',
                    type: 'linkedin',
                },
            ],
        },
        resumes: [
            {
                key: 'cloud',
                title: 'Junior Cloud Infrastructure Engineer',
                summary:
                    'State Engineer in Computer Science from ESI Algiers. Focused on Linux administration, Docker, Terraform, and automated CI/CD delivery.',
                skills: [
                    'Docker',
                    'Linux Admin',
                    'CI/CD',
                    'Bash',
                    'Terraform',
                    'Kubernetes',
                ],
                education: ['edu'],
                experience: ['exp'],
                projects: ['cloud', 'monitoring'],
                certifications: ['aws'],
                languages: ['ar', 'fr', 'en'],
                links: ['github', 'linkedin'],
            },
        ],
    },
    {
        email: 'amine.khelifi@gmail.com',
        firstName: 'Amine',
        lastName: 'Khelifi',
        phone: '+213 770 45 67 89',
        wilaya: '35 - Boumerdès',
        tier: SubscriptionTier.PRO,
        vault: {
            educations: [
                {
                    key: 'edu',
                    degree: 'Master 2 Systèmes Informatiques Distribués',
                    institution: 'USTHB Bab Ezzouar',
                    field: 'Big Data & Cloud',
                    startDate: '2020-09-01',
                    endDate: '2025-06-30',
                },
            ],
            experiences: [
                {
                    key: 'exp',
                    company: 'Algérie Télécom',
                    role: 'Backend Engineering Intern',
                    location: 'Algiers',
                    startDate: '2023-06-01',
                    endDate: '2024-08-31',
                    highlights: [
                        'Built internal APIs with Python and PostgreSQL for network inventory reconciliation.',
                        'Reduced batch processing time by 38% through query tuning and partitioned tables.',
                    ],
                },
            ],
            projects: [
                {
                    key: 'kafka',
                    title: 'Distributed Kafka ETL Pipeline',
                    projectUrl:
                        'https://github.com/amine-khelifi/kafka-etl',
                    description:
                        'Built streaming consumer pipeline ingesting 15k messages/min into partitioned PostgreSQL tables with zero message loss.',
                    date: '2024-04-01',
                    tags: ['Python', 'Kafka', 'PostgreSQL', 'Docker'],
                },
                {
                    key: 'threat',
                    title: 'mTLS Threat Detection Lab',
                    projectUrl:
                        'https://github.com/amine-khelifi/mtls-threat-lab',
                    description:
                        'Implemented mTLS authentication and encrypted payload analysis across Kafka brokers with custom anomaly rules.',
                    date: '2024-01-15',
                    tags: ['mTLS', 'Kafka', 'Python', 'OWASP'],
                },
                {
                    key: 'warehouse',
                    title: 'PostgreSQL Analytics Warehouse',
                    projectUrl:
                        'https://github.com/amine-khelifi/pg-analytics-warehouse',
                    description:
                        'Designed a star-schema warehouse and incremental dbt models for telecom usage analytics.',
                    date: '2023-11-10',
                    tags: ['PostgreSQL', 'dbt', 'SQL', 'Data Modeling'],
                },
            ],
            certifications: [
                {
                    key: 'gcp',
                    name: 'Google Data Analytics Professional Certificate',
                    issuer: 'Google',
                    issueDate: '2024-02-20',
                    credentialId: 'GDA-2024-AMINE-0921',
                },
            ],
            volunteering: [
                {
                    key: 'gdg',
                    organization: 'GDG Algiers',
                    role: 'Data Engineering Mentor',
                    description:
                        'Mentored student teams building their first streaming data projects.',
                    startDate: '2023-09-01',
                    endDate: '2024-06-30',
                },
            ],
            languages: [
                { key: 'ar', name: 'Arabic', proficiency: 'Native' },
                { key: 'fr', name: 'French', proficiency: 'Fluent' },
                { key: 'en', name: 'English', proficiency: 'Fluent' },
            ],
            links: [
                {
                    key: 'github',
                    label: 'GitHub',
                    url: 'https://github.com/amine-khelifi',
                    type: 'github',
                },
                {
                    key: 'linkedin',
                    label: 'LinkedIn',
                    url: 'https://www.linkedin.com/in/amine-khelifi',
                    type: 'linkedin',
                },
            ],
        },
        resumes: [
            {
                key: 'data',
                title: 'Data & ETL Systems Engineer',
                summary:
                    'Master 2 graduate from USTHB. Specialized in distributed pipelines, PostgreSQL, Kafka, and reliable batch and streaming workloads.',
                skills: ['Python', 'PostgreSQL', 'Kafka', 'Docker', 'dbt'],
                education: ['edu'],
                experience: ['exp'],
                projects: ['kafka', 'warehouse'],
                certifications: ['gcp'],
                languages: ['ar', 'fr', 'en'],
                links: ['github', 'linkedin'],
            },
            {
                key: 'security',
                title: 'Application Security Engineer',
                summary:
                    'Backend engineer moving into application security, with hands-on experience in mTLS, OWASP review, and secure service-to-service communication.',
                skills: [
                    'mTLS',
                    'OWASP',
                    'Threat Modeling',
                    'Python',
                    'Linux Hardening',
                ],
                education: ['edu'],
                experience: ['exp'],
                projects: ['threat'],
                languages: ['ar', 'fr', 'en'],
                links: ['github', 'linkedin'],
            },
            {
                key: 'backend',
                title: 'Backend Systems Developer',
                summary:
                    'Backend developer focused on Python, PostgreSQL, and event-driven services. Comfortable owning APIs from schema design to deployment.',
                skills: ['Python', 'PostgreSQL', 'Kafka', 'Docker', 'REST APIs'],
                education: ['edu'],
                experience: ['exp'],
                projects: ['kafka', 'warehouse'],
                links: ['github', 'linkedin'],
            },
        ],
    },
    {
        email: 'yasmine.meziane@avocat.dz',
        firstName: 'Yasmine',
        lastName: 'Meziane',
        phone: '+213 551 23 45 67',
        wilaya: '16 - Alger',
        tier: SubscriptionTier.FREE,
        vault: {
            educations: [
                {
                    key: 'edu',
                    degree: 'Master 2 Droit des Affaires',
                    institution: 'Université Alger 1 - Ben Aknoun',
                    field: 'Droit Commercial & Bancaire',
                    startDate: '2018-09-01',
                    endDate: '2023-06-30',
                },
            ],
            experiences: [
                {
                    key: 'exp',
                    company: "Banque d'Algérie",
                    role: 'Legal Intern',
                    location: 'Algiers',
                    startDate: '2022-06-01',
                    endDate: '2023-06-30',
                    highlights: [
                        'Reviewed banking compliance files and drafted internal legal notes.',
                        'Prepared contract summaries for the legal affairs department.',
                    ],
                },
            ],
            certifications: [
                {
                    key: 'capa',
                    name: 'Certificat d’Aptitude à la Profession d’Avocat (CAPA)',
                    issuer: 'Ordre National des Avocats - Barreau d’Alger',
                    issueDate: '2024-01-20',
                    credentialId: 'CAPA-ALG-2024-118',
                },
            ],
            volunteering: [
                {
                    key: 'clinic',
                    organization: 'Clinique Juridique Universitaire',
                    role: 'Legal Clinic Volunteer',
                    description:
                        'Provided supervised legal information to small businesses and students.',
                    startDate: '2021-10-01',
                    endDate: '2022-06-30',
                },
            ],
            languages: [
                { key: 'ar', name: 'Arabic', proficiency: 'Native' },
                { key: 'fr', name: 'French', proficiency: 'Fluent' },
                { key: 'en', name: 'English', proficiency: 'Intermediate' },
            ],
            links: [
                {
                    key: 'linkedin',
                    label: 'LinkedIn',
                    url: 'https://www.linkedin.com/in/yasmine-meziane',
                    type: 'linkedin',
                },
            ],
        },
        resumes: [
            {
                key: 'legal',
                title: 'Corporate Legal Counsel & Compliance Jurist',
                summary:
                    'CAPA-certified lawyer from Barreau d’Alger. Focused on corporate contracts, banking compliance, and Algerian commercial law.',
                skills: [
                    'Droit des Affaires',
                    'Contrats Commerciaux',
                    'Conformité Bancaire',
                    'Legal Research',
                ],
                education: ['edu'],
                experience: ['exp'],
                certifications: ['capa'],
                volunteering: ['clinic'],
                languages: ['ar', 'fr', 'en'],
                links: ['linkedin'],
            },
        ],
    },
    {
        email: 'lina.bensalem@design.dz',
        firstName: 'Lina',
        lastName: 'Bensalem',
        phone: '+213 660 14 22 90',
        wilaya: '16 - Alger',
        tier: SubscriptionTier.PRO,
        vault: {
            educations: [
                {
                    key: 'edu',
                    degree: 'Master en Design de Produit Numérique',
                    institution: 'École Supérieure des Beaux-Arts d’Alger',
                    field: 'UX/UI & Design Systems',
                    startDate: '2019-09-01',
                    endDate: '2024-06-30',
                },
            ],
            experiences: [
                {
                    key: 'exp',
                    company: 'Yassir',
                    role: 'Product Design Intern',
                    location: 'Algiers',
                    startDate: '2023-01-01',
                    endDate: '2024-03-31',
                    highlights: [
                        'Redesigned the driver onboarding flow and reduced drop-off in usability tests.',
                        'Maintained reusable Figma components used by three product squads.',
                    ],
                },
            ],
            projects: [
                {
                    key: 'onboarding',
                    title: 'Driver Onboarding Redesign',
                    projectUrl: 'https://www.behance.net/lina-bensalem/onboarding',
                    description:
                        'End-to-end onboarding redesign backed by 12 user interviews and moderated usability testing.',
                    date: '2024-02-01',
                    tags: ['Figma', 'User Research', 'Prototyping'],
                },
                {
                    key: 'design-system',
                    title: 'Mobility Design System',
                    projectUrl:
                        'https://www.behance.net/lina-bensalem/design-system',
                    description:
                        'Created a token-based component library and usage guidelines for web and mobile products.',
                    date: '2023-10-01',
                    tags: ['Figma', 'Design Tokens', 'Accessibility'],
                },
            ],
            certifications: [
                {
                    key: 'ux',
                    name: 'Google UX Design Professional Certificate',
                    issuer: 'Google',
                    issueDate: '2023-08-10',
                    credentialId: 'UX-GOOGLE-2023-LB-331',
                },
            ],
            languages: [
                { key: 'ar', name: 'Arabic', proficiency: 'Native' },
                { key: 'fr', name: 'French', proficiency: 'Fluent' },
                { key: 'en', name: 'English', proficiency: 'Fluent' },
            ],
            links: [
                {
                    key: 'behance',
                    label: 'Behance Portfolio',
                    url: 'https://www.behance.net/lina-bensalem',
                    type: 'portfolio',
                },
                {
                    key: 'linkedin',
                    label: 'LinkedIn',
                    url: 'https://www.linkedin.com/in/lina-bensalem',
                    type: 'linkedin',
                },
            ],
        },
        resumes: [
            {
                key: 'product',
                title: 'Product Designer - Mobility',
                summary:
                    'Product designer with a research-first approach and experience improving onboarding journeys for large consumer platforms.',
                skills: [
                    'Figma',
                    'User Research',
                    'Prototyping',
                    'Usability Testing',
                    'Accessibility',
                ],
                education: ['edu'],
                experience: ['exp'],
                projects: ['onboarding'],
                certifications: ['ux'],
                languages: ['ar', 'fr', 'en'],
                links: ['behance', 'linkedin'],
            },
            {
                key: 'design-system',
                title: 'Design Systems Specialist',
                summary:
                    'Design systems designer focused on reusable components, design tokens, accessibility, and collaboration with engineering teams.',
                skills: [
                    'Design Systems',
                    'Design Tokens',
                    'Figma',
                    'Accessibility',
                    'Documentation',
                ],
                education: ['edu'],
                experience: ['exp'],
                projects: ['design-system'],
                languages: ['ar', 'fr', 'en'],
                links: ['behance', 'linkedin'],
            },
        ],
    },
    {
        email: 'yacine.bouzid@enp.edu.dz',
        firstName: 'Yacine',
        lastName: 'Bouzid',
        phone: '+213 550 89 11 44',
        wilaya: '16 - Alger',
        tier: SubscriptionTier.FREE,
        vault: {
            educations: [
                {
                    key: 'edu',
                    degree: 'Diplôme d’Ingénieur d’État en Génie Civil',
                    institution: 'École Nationale Polytechnique (ENP)',
                    field: 'Structures & Matériaux',
                    startDate: '2018-09-01',
                    endDate: '2023-07-01',
                },
            ],
            experiences: [
                {
                    key: 'exp',
                    company: 'Cosider Construction',
                    role: 'Site Engineer',
                    location: 'Alger',
                    startDate: '2023-09-01',
                    endDate: 'Present',
                    highlights: [
                        'Supervised reinforced concrete works for a public infrastructure package.',
                        'Coordinated material testing and daily quality-control reporting.',
                    ],
                },
            ],
            projects: [
                {
                    key: 'bridge',
                    title: 'Modular Footbridge Study',
                    description:
                        'Structural analysis and cost comparison for a modular steel footbridge in an urban context.',
                    date: '2023-05-01',
                    tags: ['AutoCAD', 'SAP2000', 'Steel Design'],
                },
            ],
            languages: [
                { key: 'ar', name: 'Arabic', proficiency: 'Native' },
                { key: 'fr', name: 'French', proficiency: 'Fluent' },
                { key: 'en', name: 'English', proficiency: 'Intermediate' },
            ],
            links: [
                {
                    key: 'linkedin',
                    label: 'LinkedIn',
                    url: 'https://www.linkedin.com/in/yacine-bouzid',
                    type: 'linkedin',
                },
            ],
        },
        resumes: [],
    },
    {
        email: 'meriem.cherif@usthb.dz',
        firstName: 'Meriem',
        lastName: 'Cherif',
        phone: '+213 662 30 78 15',
        wilaya: '16 - Alger',
        tier: SubscriptionTier.PRO,
        vault: {
            educations: [
                {
                    key: 'edu',
                    degree: 'Master 2 Data Science & Intelligence Artificielle',
                    institution: 'USTHB Bab Ezzouar',
                    field: 'Machine Learning',
                    startDate: '2019-09-01',
                    endDate: '2024-06-30',
                },
            ],
            experiences: [
                {
                    key: 'exp',
                    company: 'Sonatrach',
                    role: 'Data Analyst Intern',
                    location: 'Algiers',
                    startDate: '2023-02-01',
                    endDate: '2024-01-31',
                    highlights: [
                        'Built maintenance KPI dashboards used by operational teams.',
                        'Automated weekly reporting and reduced manual preparation time by 6 hours.',
                    ],
                },
            ],
            projects: [
                {
                    key: 'churn',
                    title: 'Telecom Churn Prediction',
                    projectUrl:
                        'https://github.com/meriem-cherif/churn-prediction',
                    description:
                        'Compared gradient boosting and logistic regression models, reaching 0.86 ROC-AUC on customer churn data.',
                    date: '2024-03-01',
                    tags: ['Python', 'scikit-learn', 'Pandas', 'SQL'],
                },
                {
                    key: 'nlp',
                    title: 'CV-Job Matching NLP',
                    projectUrl:
                        'https://github.com/meriem-cherif/cv-job-matching',
                    description:
                        'Built a semantic matching prototype for CVs and job descriptions using sentence embeddings.',
                    date: '2024-01-20',
                    tags: ['Python', 'NLP', 'Transformers', 'FastAPI'],
                },
                {
                    key: 'dashboard',
                    title: 'Maintenance Analytics Dashboard',
                    description:
                        'Designed a Power BI dashboard for equipment downtime, backlog, and intervention trends.',
                    date: '2023-11-01',
                    tags: ['Power BI', 'DAX', 'SQL'],
                },
            ],
            certifications: [
                {
                    key: 'google',
                    name: 'Google Advanced Data Analytics Certificate',
                    issuer: 'Google',
                    issueDate: '2023-12-05',
                    credentialId: 'GADA-2023-MC-7781',
                },
            ],
            volunteering: [
                {
                    key: 'wit',
                    organization: 'Women in Tech Algiers',
                    role: 'ML Study Group Facilitator',
                    description:
                        'Facilitated monthly study sessions on practical machine learning workflows.',
                    startDate: '2023-03-01',
                    endDate: '2024-05-31',
                },
            ],
            languages: [
                { key: 'ar', name: 'Arabic', proficiency: 'Native' },
                { key: 'fr', name: 'French', proficiency: 'Fluent' },
                { key: 'en', name: 'English', proficiency: 'Fluent' },
            ],
            links: [
                {
                    key: 'github',
                    label: 'GitHub',
                    url: 'https://github.com/meriem-cherif',
                    type: 'github',
                },
                {
                    key: 'kaggle',
                    label: 'Kaggle',
                    url: 'https://www.kaggle.com/meriemcherif',
                    type: 'portfolio',
                },
            ],
        },
        resumes: [
            {
                key: 'ml',
                title: 'Machine Learning Engineer',
                summary:
                    'Data scientist with production-oriented ML project experience across churn prediction, NLP matching, and analytics dashboards.',
                skills: [
                    'Python',
                    'scikit-learn',
                    'SQL',
                    'NLP',
                    'FastAPI',
                    'Power BI',
                ],
                education: ['edu'],
                experience: ['exp'],
                projects: ['churn', 'nlp'],
                certifications: ['google'],
                volunteering: ['wit'],
                languages: ['ar', 'fr', 'en'],
                links: ['github', 'kaggle'],
            },
            {
                key: 'analyst',
                title: 'Data Analyst',
                summary:
                    'Analyst focused on clear metrics, SQL modeling, and dashboards that help operational teams make faster decisions.',
                skills: ['SQL', 'Power BI', 'Excel', 'Python', 'Data Storytelling'],
                education: ['edu'],
                experience: ['exp'],
                projects: ['churn', 'dashboard'],
                certifications: ['google'],
                languages: ['ar', 'fr', 'en'],
                links: ['github'],
            },
            {
                key: 'research',
                title: 'AI Research Assistant',
                summary:
                    'Research-oriented Master 2 graduate with experience in semantic matching, model evaluation, and reproducible experiments.',
                skills: ['Python', 'NLP', 'Transformers', 'Experiment Design'],
                education: ['edu'],
                projects: ['nlp'],
                certifications: ['google'],
                languages: ['ar', 'fr', 'en'],
                links: ['github', 'kaggle'],
            },
        ],
    },
    {
        email: 'walid.saadi@hec.dz',
        firstName: 'Walid',
        lastName: 'Saadi',
        phone: '+213 553 47 20 61',
        wilaya: '16 - Alger',
        tier: SubscriptionTier.FREE,
        vault: {
            educations: [
                {
                    key: 'edu',
                    degree: 'Master 2 Audit & Contrôle de Gestion',
                    institution: 'HEC Alger',
                    field: 'Finance d’Entreprise',
                    startDate: '2018-09-01',
                    endDate: '2023-06-30',
                },
            ],
            experiences: [
                {
                    key: 'exp',
                    company: 'KPMG Algérie',
                    role: 'Audit Intern',
                    location: 'Algiers',
                    startDate: '2022-09-01',
                    endDate: '2023-09-30',
                    highlights: [
                        'Performed substantive testing on revenue and procurement cycles.',
                        'Prepared audit workpapers and variance analysis for two industrial clients.',
                    ],
                },
            ],
            projects: [
                {
                    key: 'dashboard',
                    title: 'Budget Variance Dashboard',
                    description:
                        'Built a Power BI dashboard to track budget variances and cost-center performance.',
                    date: '2023-04-01',
                    tags: ['Power BI', 'Excel', 'SQL'],
                },
            ],
            certifications: [
                {
                    key: 'cfa',
                    name: 'CFA Level I Candidate',
                    issuer: 'CFA Institute',
                    issueDate: '2024-05-01',
                },
            ],
            languages: [
                { key: 'ar', name: 'Arabic', proficiency: 'Native' },
                { key: 'fr', name: 'French', proficiency: 'Fluent' },
                { key: 'en', name: 'English', proficiency: 'Intermediate' },
            ],
            links: [
                {
                    key: 'linkedin',
                    label: 'LinkedIn',
                    url: 'https://www.linkedin.com/in/walid-saadi',
                    type: 'linkedin',
                },
            ],
        },
        resumes: [
            {
                key: 'audit',
                title: 'Financial Auditor',
                summary:
                    'Audit graduate with internship experience in external audit, substantive testing, and financial reporting analysis.',
                skills: [
                    'Audit',
                    'IFRS',
                    'Excel',
                    'Power BI',
                    'Financial Analysis',
                ],
                education: ['edu'],
                experience: ['exp'],
                projects: ['dashboard'],
                certifications: ['cfa'],
                languages: ['ar', 'fr', 'en'],
                links: ['linkedin'],
            },
        ],
    },
    {
        email: 'nour.kaci@ehec.dz',
        firstName: 'Nour',
        middleName: 'El Houda',
        lastName: 'Kaci',
        phone: '+213 555 62 09 88',
        wilaya: '16 - Alger',
        tier: SubscriptionTier.PRO,
        vault: {
            educations: [
                {
                    key: 'edu',
                    degree: 'Master 2 Marketing & Communication Digitale',
                    institution: 'EHEC Alger',
                    field: 'Marketing Digital',
                    startDate: '2019-09-01',
                    endDate: '2024-06-30',
                },
            ],
            experiences: [
                {
                    key: 'exp',
                    company: 'Djezzy',
                    role: 'Marketing Intern',
                    location: 'Algiers',
                    startDate: '2023-03-01',
                    endDate: '2024-04-30',
                    highlights: [
                        'Coordinate campaign reporting across social, CRM, and paid channels.',
                        'Drafted monthly performance summaries for the marketing team.',
                    ],
                },
            ],
            projects: [
                {
                    key: 'campaign',
                    title: 'Ramadan Campaign Analytics',
                    description:
                        'Analyzed engagement and conversion performance across a multi-channel Ramadan campaign.',
                    date: '2024-03-20',
                    tags: ['Meta Ads', 'Google Analytics', 'Excel'],
                },
                {
                    key: 'content',
                    title: 'Employer Brand Content Plan',
                    description:
                        'Built a content calendar and employee-story format for recruitment marketing.',
                    date: '2023-12-01',
                    tags: ['Content Strategy', 'Copywriting', 'Social Media'],
                },
            ],
            certifications: [
                {
                    key: 'meta',
                    name: 'Meta Certified Digital Marketing Associate',
                    issuer: 'Meta',
                    issueDate: '2023-11-15',
                    credentialId: 'META-DMA-2023-NK-224',
                },
            ],
            languages: [
                { key: 'ar', name: 'Arabic', proficiency: 'Native' },
                { key: 'fr', name: 'French', proficiency: 'Fluent' },
                { key: 'en', name: 'English', proficiency: 'Fluent' },
            ],
            links: [
                {
                    key: 'portfolio',
                    label: 'Marketing Portfolio',
                    url: 'https://nour-kaci.notion.site',
                    type: 'portfolio',
                },
                {
                    key: 'linkedin',
                    label: 'LinkedIn',
                    url: 'https://www.linkedin.com/in/nour-kaci',
                    type: 'linkedin',
                },
            ],
        },
        resumes: [
            {
                key: 'marketing',
                title: 'Digital Marketing Specialist',
                summary:
                    'Digital marketing graduate with hands-on campaign reporting, paid social, and content coordination experience.',
                skills: [
                    'Meta Ads',
                    'Google Analytics',
                    'Content Strategy',
                    'SEO',
                    'Excel',
                ],
                education: ['edu'],
                experience: ['exp'],
                projects: ['campaign'],
                certifications: ['meta'],
                languages: ['ar', 'fr', 'en'],
                links: ['portfolio', 'linkedin'],
            },
            {
                key: 'comms',
                title: 'Brand & Communications Officer',
                summary:
                    'Communications specialist focused on employer branding, storytelling, and consistent multi-channel messaging.',
                skills: [
                    'Copywriting',
                    'Content Strategy',
                    'Social Media',
                    'Employer Branding',
                ],
                education: ['edu'],
                experience: ['exp'],
                projects: ['content'],
                languages: ['ar', 'fr', 'en'],
                links: ['portfolio', 'linkedin'],
            },
        ],
    },
    {
        email: 'riad.belkacem@usto.dz',
        firstName: 'Riad',
        lastName: 'Belkacem',
        phone: '+213 559 73 41 26',
        wilaya: '31 - Oran',
        tier: SubscriptionTier.FREE,
        vault: {
            educations: [
                {
                    key: 'edu',
                    degree: 'Diplôme d’Ingénieur d’État en Génie Mécanique',
                    institution:
                        'Université des Sciences et de la Technologie d’Oran Mohamed Boudiaf',
                    field: 'Énergétique & Turbomachines',
                    startDate: '2018-09-01',
                    endDate: '2023-07-01',
                },
            ],
            experiences: [
                {
                    key: 'exp',
                    company: 'Sonelgaz',
                    role: 'Mechanical Maintenance Intern',
                    location: 'Oran',
                    startDate: '2022-06-01',
                    endDate: '2023-06-30',
                    highlights: [
                        'Assisted preventive maintenance planning for gas turbine auxiliaries.',
                        'Documented vibration analysis findings for rotating equipment.',
                    ],
                },
            ],
            projects: [
                {
                    key: 'turbine',
                    title: 'Micro-Turbine Efficiency Study',
                    description:
                        'Modeled efficiency losses in a micro-turbine test bench and proposed nozzle geometry improvements.',
                    date: '2023-05-01',
                    tags: ['SolidWorks', 'MATLAB', 'Thermodynamics'],
                },
            ],
            languages: [
                { key: 'ar', name: 'Arabic', proficiency: 'Native' },
                { key: 'fr', name: 'French', proficiency: 'Fluent' },
                { key: 'en', name: 'English', proficiency: 'Basic' },
            ],
            links: [
                {
                    key: 'linkedin',
                    label: 'LinkedIn',
                    url: 'https://www.linkedin.com/in/riad-belkacem',
                    type: 'linkedin',
                },
            ],
        },
        resumes: [],
    },
    {
        email: 'salima.ouldali@univ-alger3.dz',
        firstName: 'Salima',
        lastName: 'Ould Ali',
        phone: '+213 661 52 84 30',
        wilaya: '16 - Alger',
        tier: SubscriptionTier.PRO,
        vault: {
            educations: [
                {
                    key: 'edu',
                    degree: 'Master 2 Gestion des Ressources Humaines',
                    institution: 'Université Alger 3',
                    field: 'Talent Management',
                    startDate: '2019-09-01',
                    endDate: '2024-06-30',
                },
            ],
            experiences: [
                {
                    key: 'exp',
                    company: 'Cevital',
                    role: 'Human Resources Intern',
                    location: 'Bejaia',
                    startDate: '2023-01-01',
                    endDate: '2024-02-29',
                    highlights: [
                        'Screened candidate applications and coordinated interview panels.',
                        'Updated recruitment trackers and onboarding documentation.',
                    ],
                },
            ],
            projects: [
                {
                    key: 'hris',
                    title: 'Recruitment Funnel Dashboard',
                    description:
                        'Built a reporting view for time-to-hire, source quality, and stage conversion.',
                    date: '2024-01-15',
                    tags: ['Excel', 'Power BI', 'HRIS'],
                },
            ],
            certifications: [
                {
                    key: 'hr-cert',
                    name: 'People Analytics Certificate',
                    issuer: 'Coursera',
                    issueDate: '2023-10-10',
                    credentialId: 'PEOPLE-ANALYTICS-SOA-882',
                },
            ],
            languages: [
                { key: 'ar', name: 'Arabic', proficiency: 'Native' },
                { key: 'fr', name: 'French', proficiency: 'Fluent' },
                { key: 'en', name: 'English', proficiency: 'Intermediate' },
            ],
            links: [
                {
                    key: 'linkedin',
                    label: 'LinkedIn',
                    url: 'https://www.linkedin.com/in/salima-ould-ali',
                    type: 'linkedin',
                },
            ],
        },
        resumes: [
            {
                key: 'hr',
                title: 'HR & Talent Acquisition Officer',
                summary:
                    'HR graduate with recruitment coordination experience, people analytics training, and strong candidate communication skills.',
                skills: [
                    'Recruitment',
                    'HRIS',
                    'People Analytics',
                    'Communication',
                    'Onboarding',
                ],
                education: ['edu'],
                experience: ['exp'],
                projects: ['hris'],
                certifications: ['hr-cert'],
                languages: ['ar', 'fr', 'en'],
                links: ['linkedin'],
            },
        ],
    },
    {
        email: 'anis.rahmani@usthb.dz',
        firstName: 'Anis',
        lastName: 'Rahmani',
        phone: '+213 770 19 63 52',
        wilaya: '16 - Alger',
        tier: SubscriptionTier.FREE,
        vault: {
            educations: [
                {
                    key: 'edu',
                    degree: 'Licence en Informatique - Sécurité des Systèmes',
                    institution: 'USTHB Bab Ezzouar',
                    field: 'Cybersecurity',
                    startDate: '2020-09-01',
                    endDate: '2023-06-30',
                },
            ],
            experiences: [
                {
                    key: 'exp',
                    company: 'Algérie Télécom',
                    role: 'SOC Intern',
                    location: 'Algiers',
                    startDate: '2023-06-01',
                    endDate: '2024-01-31',
                    highlights: [
                        'Triaged security alerts and documented incident response steps.',
                        'Created detection notes for suspicious authentication activity.',
                    ],
                },
            ],
            projects: [
                {
                    key: 'siem',
                    title: 'Home SOC & SIEM Lab',
                    projectUrl: 'https://github.com/anis-rahmani/home-soc-lab',
                    description:
                        'Deployed Wazuh and Suricata in a lab environment with custom detection rules and dashboards.',
                    date: '2024-02-01',
                    tags: ['Wazuh', 'Suricata', 'Linux', 'Incident Response'],
                },
            ],
            certifications: [
                {
                    key: 'security-plus',
                    name: 'CompTIA Security+',
                    issuer: 'CompTIA',
                    issueDate: '2024-04-12',
                    credentialId: 'COMP001021-AR-4471',
                },
            ],
            languages: [
                { key: 'ar', name: 'Arabic', proficiency: 'Native' },
                { key: 'fr', name: 'French', proficiency: 'Fluent' },
                { key: 'en', name: 'English', proficiency: 'Fluent' },
            ],
            links: [
                {
                    key: 'github',
                    label: 'GitHub',
                    url: 'https://github.com/anis-rahmani',
                    type: 'github',
                },
                {
                    key: 'linkedin',
                    label: 'LinkedIn',
                    url: 'https://www.linkedin.com/in/anis-rahmani',
                    type: 'linkedin',
                },
            ],
        },
        resumes: [
            {
                key: 'soc',
                title: 'Cybersecurity Analyst (SOC)',
                summary:
                    'Security-focused IT graduate with SOC internship experience, home-lab detection engineering, and CompTIA Security+ certification.',
                skills: [
                    'Networking',
                    'SIEM',
                    'Incident Response',
                    'Wazuh',
                    'Suricata',
                    'Linux',
                ],
                education: ['edu'],
                experience: ['exp'],
                projects: ['siem'],
                certifications: ['security-plus'],
                languages: ['ar', 'fr', 'en'],
                links: ['github', 'linkedin'],
            },
        ],
    },
    {
        email: 'khadija.larbi@epau.dz',
        firstName: 'Khadija',
        lastName: 'Larbi',
        phone: '+213 550 26 74 18',
        wilaya: '16 - Alger',
        tier: SubscriptionTier.FREE,
        vault: {
            educations: [
                {
                    key: 'edu',
                    degree: 'Diplôme d’Architecte d’État',
                    institution:
                        'EPAU - École Polytechnique d’Architecture et d’Urbanisme',
                    field: 'Architecture & Urbanisme',
                    startDate: '2017-09-01',
                    endDate: '2022-07-01',
                },
            ],
            experiences: [
                {
                    key: 'exp',
                    company: 'Atelier d’Architecture El Djazaïr',
                    role: 'Architect Intern',
                    location: 'Algiers',
                    startDate: '2021-06-01',
                    endDate: '2022-06-30',
                    highlights: [
                        'Produced permit drawings and technical documentation for residential projects.',
                        'Coordinated revisions between structural and architectural drawings.',
                    ],
                },
            ],
            projects: [
                {
                    key: 'eco',
                    title: 'Eco-Neighborhood Masterplan',
                    description:
                        'Urban design study for a mixed-use neighborhood with passive cooling and shared public space.',
                    date: '2022-05-01',
                    tags: ['AutoCAD', 'Revit', 'SketchUp'],
                },
            ],
            languages: [
                { key: 'ar', name: 'Arabic', proficiency: 'Native' },
                { key: 'fr', name: 'French', proficiency: 'Fluent' },
                { key: 'en', name: 'English', proficiency: 'Intermediate' },
            ],
            links: [
                {
                    key: 'linkedin',
                    label: 'LinkedIn',
                    url: 'https://www.linkedin.com/in/khadija-larbi',
                    type: 'linkedin',
                },
            ],
        },
        resumes: [],
    },
];

const positions: PositionSeed[] = [
    {
        key: 'cloud',
        recruiterEmail: 'recruiter@techcorp.dz',
        companyName: 'TechCorp DZ',
        title: 'Junior Cloud Infrastructure Engineer',
        department: 'Cloud & Systems',
        location: 'Algiers (Hybrid)',
        deadlineDays: 14,
        status: PositionStatus.OPEN,
        rubric: {
            mandatoryCriteria: ['Docker', 'Linux Admin', 'CI/CD'],
            preferredCriteria: ['Go', 'Kubernetes'],
            minimumScoreThreshold: 70,
        },
    },
    {
        key: 'backend',
        recruiterEmail: 'recruiter@techcorp.dz',
        companyName: 'TechCorp DZ',
        title: 'Backend Systems Developer (Go/PostgreSQL)',
        department: 'Core Infrastructure',
        location: 'Kouba, Algiers',
        deadlineDays: 21,
        status: PositionStatus.OPEN,
        rubric: {
            mandatoryCriteria: ['Go', 'PostgreSQL', 'Docker'],
            preferredCriteria: ['Microservices', 'Kafka'],
            minimumScoreThreshold: 75,
        },
    },
    {
        key: 'product',
        recruiterEmail: 'recruiter@techcorp.dz',
        companyName: 'TechCorp DZ',
        title: 'Product Designer (UX/UI)',
        department: 'Product',
        location: 'Algiers (Hybrid)',
        deadlineDays: 18,
        status: PositionStatus.OPEN,
        rubric: {
            mandatoryCriteria: ['Figma', 'Design Systems', 'User Research'],
            preferredCriteria: ['Prototyping', 'Accessibility'],
            minimumScoreThreshold: 70,
        },
    },
    {
        key: 'data-science',
        recruiterEmail: 'recruiter@techcorp.dz',
        companyName: 'TechCorp DZ',
        title: 'Data Scientist / ML Engineer',
        department: 'Data',
        location: 'Algiers (Remote)',
        deadlineDays: 25,
        status: PositionStatus.OPEN,
        rubric: {
            mandatoryCriteria: ['Python', 'SQL', 'Machine Learning', 'MLOps'],
            preferredCriteria: ['NLP', 'Deep Learning'],
            minimumScoreThreshold: 75,
        },
    },
    {
        key: 'cyber',
        recruiterEmail: 'recruiter@techcorp.dz',
        companyName: 'TechCorp DZ',
        title: 'Cybersecurity Analyst (SOC)',
        department: 'Security',
        location: 'Algiers (On-site)',
        deadlineDays: 16,
        status: PositionStatus.OPEN,
        rubric: {
            mandatoryCriteria: [
                'Networking',
                'SIEM',
                'Incident Response',
            ],
            preferredCriteria: ['CompTIA Security+', 'Wazuh'],
            minimumScoreThreshold: 70,
        },
    },
    {
        key: 'legal',
        recruiterEmail: 'rh@banque-algerie.dz',
        companyName: "Banque d'Algérie",
        title: 'Juriste Droit Bancaire & Conformité',
        department: 'Affaires Juridiques',
        location: 'Algiers (On-site)',
        deadlineDays: 12,
        status: PositionStatus.OPEN,
        rubric: {
            mandatoryCriteria: [
                'Droit des Affaires',
                'Contrats Commerciaux',
                'Conformité Bancaire',
            ],
            preferredCriteria: ['CAPA', 'Legal Research'],
            minimumScoreThreshold: 70,
        },
    },
    {
        key: 'audit',
        recruiterEmail: 'rh@banque-algerie.dz',
        companyName: "Banque d'Algérie",
        title: 'Financial Auditor / Analyst',
        department: 'Audit Interne',
        location: 'Algiers (Hybrid)',
        deadlineDays: 20,
        status: PositionStatus.OPEN,
        rubric: {
            mandatoryCriteria: ['Audit', 'IFRS', 'Excel', 'Power BI'],
            preferredCriteria: ['CFA', 'SQL'],
            minimumScoreThreshold: 72,
        },
    },
    {
        key: 'hr',
        recruiterEmail: 'rh@banque-algerie.dz',
        companyName: "Banque d'Algérie",
        title: 'HR & Talent Acquisition Officer',
        department: 'Ressources Humaines',
        location: 'Algiers (On-site)',
        deadlineDays: 9,
        status: PositionStatus.OPEN,
        rubric: {
            mandatoryCriteria: ['Recruitment', 'HRIS', 'Communication'],
            preferredCriteria: ['People Analytics', 'Onboarding'],
            minimumScoreThreshold: 70,
        },
    },
    {
        key: 'sre-2025',
        recruiterEmail: 'recruiter@techcorp.dz',
        companyName: 'TechCorp DZ',
        title: 'Site Reliability Engineer (2025 Cohort)',
        department: 'Cloud & Systems',
        location: 'Algiers',
        deadlineDays: -5,
        status: PositionStatus.CLOSED,
        rubric: {
            mandatoryCriteria: ['Kubernetes', 'Prometheus', 'Linux'],
            preferredCriteria: ['Terraform', 'Go'],
            minimumScoreThreshold: 80,
        },
    },
    {
        key: 'marketing-2025',
        recruiterEmail: 'recruiter@techcorp.dz',
        companyName: 'TechCorp DZ',
        title: 'Marketing & Communications Specialist (2025)',
        department: 'Marketing',
        location: 'Algiers (Hybrid)',
        deadlineDays: -20,
        status: PositionStatus.CLOSED,
        rubric: {
            mandatoryCriteria: ['SEO', 'Content Strategy', 'Analytics'],
            preferredCriteria: ['Meta Ads', 'Copywriting'],
            minimumScoreThreshold: 70,
        },
    },
    {
        key: 'legal-counsel-2025',
        recruiterEmail: 'rh@banque-algerie.dz',
        companyName: "Banque d'Algérie",
        title: 'Legal Counsel - Corporate & Compliance (2025)',
        department: 'Affaires Juridiques',
        location: 'Algiers (On-site)',
        deadlineDays: -35,
        status: PositionStatus.CLOSED,
        rubric: {
            mandatoryCriteria: [
                'Corporate Law',
                'Compliance',
                'Contract Drafting',
            ],
            preferredCriteria: ['Banking Law', 'French'],
            minimumScoreThreshold: 75,
        },
    },
];

const applications: ApplicationSeed[] = [
    {
        applicantEmail: 'samy.benali@esi.dz',
        profileKey: 'cloud',
        positionKey: 'cloud',
        anonymousId: 'DZ-308',
        status: ApplicationStatus.INTERVIEW_PENDING,
        matchScore: 94,
        interview: true,
    },
    {
        applicantEmail: 'amine.khelifi@gmail.com',
        profileKey: 'backend',
        positionKey: 'backend',
        anonymousId: 'DZ-309',
        status: ApplicationStatus.ELIGIBLE,
        matchScore: 88,
    },
    {
        applicantEmail: 'amine.khelifi@gmail.com',
        profileKey: 'data',
        positionKey: 'data-science',
        anonymousId: 'DZ-309',
        status: ApplicationStatus.REDIRECTED,
        matchScore: 62,
        unmet: ['MLOps'],
        gapAnalysis: {
            badge: 'ACTIONABLE GAP ANALYSIS [ZERO GHOSTING]',
            headlineReason:
                'Why this resume was not selected for Data Scientist / ML Engineer',
            verifiedStrengths: [
                'Python',
                'SQL',
                'Machine Learning',
                'Data pipelines',
            ],
            unmetMandatoryReasons: [
                'Missing mandatory requirement: MLOps',
            ],
            recommendedBridgePath: {
                title: 'Ship an end-to-end ML pipeline with monitoring',
                actionableMilestones: [
                    'Package a model with a reproducible training pipeline and versioned data snapshot.',
                    'Deploy the model behind an API with drift, latency, and error monitoring.',
                ],
                reapplicationReadinessMilestone:
                    'Publish the repository and link the deployed demo on your next application.',
            },
        },
    },
    {
        applicantEmail: 'yasmine.meziane@avocat.dz',
        profileKey: 'legal',
        positionKey: 'legal',
        anonymousId: 'DZ-310',
        status: ApplicationStatus.ELIGIBLE,
        matchScore: 92,
    },
    {
        applicantEmail: 'lina.bensalem@design.dz',
        profileKey: 'product',
        positionKey: 'product',
        anonymousId: 'DZ-311',
        status: ApplicationStatus.INTERVIEW_PENDING,
        matchScore: 90,
        interview: true,
    },
    {
        applicantEmail: 'meriem.cherif@usthb.dz',
        profileKey: 'ml',
        positionKey: 'data-science',
        anonymousId: 'DZ-312',
        status: ApplicationStatus.INTERVIEW_PENDING,
        matchScore: 91,
        interview: true,
    },
    {
        applicantEmail: 'walid.saadi@hec.dz',
        profileKey: 'audit',
        positionKey: 'audit',
        anonymousId: 'DZ-313',
        status: ApplicationStatus.NEEDS_REVIEW,
        matchScore: 72,
        unmet: ['IFRS'],
    },
    {
        applicantEmail: 'nour.kaci@ehec.dz',
        profileKey: 'marketing',
        positionKey: 'marketing-2025',
        anonymousId: 'DZ-314',
        status: ApplicationStatus.CLOSED,
        matchScore: 63,
    },
    {
        applicantEmail: 'salima.ouldali@univ-alger3.dz',
        profileKey: 'hr',
        positionKey: 'hr',
        anonymousId: 'DZ-315',
        status: ApplicationStatus.ELIGIBLE,
        matchScore: 84,
    },
    {
        applicantEmail: 'anis.rahmani@usthb.dz',
        profileKey: 'soc',
        positionKey: 'cyber',
        anonymousId: 'DZ-316',
        status: ApplicationStatus.ELIGIBLE,
        matchScore: 87,
    },
];

async function main() {
    console.log('Starting Skillora database seeding...');

    await prisma.interviewEvent.deleteMany();
    await prisma.agentExecutionLog.deleteMany();
    await prisma.application.deleteMany();
    await prisma.recruiterSlot.deleteMany();
    await prisma.position.deleteMany();
    await prisma.applicantProfile.deleteMany();
    await prisma.vaultEducation.deleteMany();
    await prisma.vaultExperience.deleteMany();
    await prisma.vaultProject.deleteMany();
    await prisma.vaultCertification.deleteMany();
    await prisma.vaultVolunteering.deleteMany();
    await prisma.vaultLanguage.deleteMany();
    await prisma.vaultLink.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('password123', 10);

    const recruiters = [
        {
            email: 'recruiter@techcorp.dz',
            firstName: 'Karim',
            lastName: 'Haddad',
            phone: '+213 550 12 34 56',
            wilaya: '16 - Alger',
            companyName: 'TechCorp DZ',
        },
        {
            email: 'rh@banque-algerie.dz',
            firstName: 'Fatima',
            lastName: 'Mansouri',
            phone: '+213 555 98 76 54',
            wilaya: '16 - Alger',
            companyName: "Banque d'Algérie",
        },
    ];

    for (const recruiter of recruiters) {
        const user = await prisma.user.create({
            data: {
                email: recruiter.email,
                passwordHash,
                firstName: recruiter.firstName,
                lastName: recruiter.lastName,
                phone: recruiter.phone,
                wilaya: recruiter.wilaya,
                companyName: recruiter.companyName,
                role: Role.RECRUITER,
                subscriptionTier: SubscriptionTier.ENTERPRISE,
            },
        });
        recruiterRefs.set(recruiter.email, user.id);
    }

    console.log(`Created ${recruiters.length} recruiters`);
    console.log('Creating applicants...');
    for (const applicant of applicants) {
        await createApplicant(applicant, passwordHash);
    }

    console.log('Creating positions...');
    for (const position of positions) {
        await createPosition(position);
    }

    console.log('Creating applications...');
    for (const application of applications) {
        await createApplication(application);
    }

    const [
        userCount,
        applicantCount,
        positionCount,
        openPositionCount,
        closedPositionCount,
        resumeCount,
        applicationCount,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: Role.APPLICANT } }),
        prisma.position.count(),
        prisma.position.count({ where: { status: PositionStatus.OPEN } }),
        prisma.position.count({ where: { status: PositionStatus.CLOSED } }),
        prisma.applicantProfile.count(),
        prisma.application.count(),
    ]);

    console.log('\nSeeding completed');
    console.log('------------------------------------------------------------');
    console.log(`Users: ${userCount}`);
    console.log(`Applicants: ${applicantCount}`);
    console.log(`Positions: ${positionCount} (${openPositionCount} open / ${closedPositionCount} closed)`);
    console.log(`Tailored resumes: ${resumeCount}`);
    console.log(`Applications: ${applicationCount}`);
    console.log('------------------------------------------------------------');
    console.log('Recruiter: recruiter@techcorp.dz / password123');
    console.log('Recruiter: rh@banque-algerie.dz / password123');
    console.log('Applicants:');
    for (const applicant of applicants) {
        console.log(
            `  ${applicant.email} - ${applicant.firstName} ${applicant.lastName} - ${applicant.resumes.length} resume(s)`
        );
    }
    console.log('All accounts use password123.');
}

main()
    .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
