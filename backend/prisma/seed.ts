import {
    PrismaClient,
    Role,
    SubscriptionTier,
    PositionStatus,
    ApplicationStatus,
    InterviewStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Skillora Database Seeding...');

    // 1. Clean existing records in correct foreign key order
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
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('password123', 10);

    // 2. Create Recruiters
    const recruiter1 = await prisma.user.create({
        data: {
            email: 'recruiter@techcorp.dz',
            passwordHash,
            firstName: 'Karim',
            lastName: 'Haddad',
            phone: '+213 550 12 34 56',
            wilaya: '16 - Alger',
            companyName: 'TechCorp DZ',
            role: Role.RECRUITER,
            subscriptionTier: SubscriptionTier.ENTERPRISE,
        },
    });

    const recruiter2 = await prisma.user.create({
        data: {
            email: 'rh@banque-algerie.dz',
            passwordHash,
            firstName: 'Fatima',
            lastName: 'Mansouri',
            phone: '+213 555 98 76 54',
            wilaya: '16 - Alger',
            companyName: "Banque d'Algérie",
            role: Role.RECRUITER,
            subscriptionTier: SubscriptionTier.ENTERPRISE,
        },
    });

    console.log('✅ Created 2 Recruiters');

    // 3. Create Applicants
    // Applicant A: Samy Benali (Free tier)
    const candidateFree = await prisma.user.create({
        data: {
            email: 'samy.benali@esi.dz',
            passwordHash,
            firstName: 'Samy',
            middleName: 'Abdelkader',
            lastName: 'Benali',
            phone: '+213 661 78 90 12',
            wilaya: '16 - Alger',
            role: Role.APPLICANT,
            subscriptionTier: SubscriptionTier.FREE,
        },
    });

    // Applicant B: Amine Khelifi (Pro tier with multi-profiles)
    const candidatePro = await prisma.user.create({
        data: {
            email: 'amine.khelifi@gmail.com',
            passwordHash,
            firstName: 'Amine',
            lastName: 'Khelifi',
            phone: '+213 770 45 67 89',
            wilaya: '35 - Boumerdès',
            role: Role.APPLICANT,
            subscriptionTier: SubscriptionTier.PRO,
            subscriptionExpiresAt: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
        },
    });

    // Applicant C: Yasmine Meziane (Legal background)
    const candidateLegal = await prisma.user.create({
        data: {
            email: 'yasmine.meziane@avocat.dz',
            passwordHash,
            firstName: 'Yasmine',
            lastName: 'Meziane',
            phone: '+213 551 23 45 67',
            wilaya: '16 - Alger',
            role: Role.APPLICANT,
            subscriptionTier: SubscriptionTier.FREE,
        },
    });

    console.log('✅ Created 3 Applicants (Free & Pro)');

    // 4. Create Master Evidence Vault Items
    // Education for Samy
    const eduSamy = await prisma.vaultEducation.create({
        data: {
            userId: candidateFree.id,
            degree: "Ingénieur d'État en Informatique",
            institution: 'ESI (Ex-INI) Algiers',
            field: 'Systèmes Informatiques Distribués',
            startDate: '2019',
            endDate: '2024',
        },
    });

    // Vault Project for Samy with Multi-Narrative Angles
    const projSamy = await prisma.vaultProject.create({
        data: {
            userId: candidateFree.id,
            title: 'Cloud Infrastructure Orchestrator',
            projectUrl:
                'https://github.com/samy-benali/cloud-infra-orchestrator',
            tags: ['Go', 'Terraform', 'Docker', 'CI/CD'],
            narratives: [
                {
                    label: 'Systems & DevOps Angle',
                    text: 'Architected automated zero-downtime deployment workflows using GitHub Actions and Terraform provisioning on Alpine Linux.',
                },
                {
                    label: 'Backend & High-Throughput Angle',
                    text: 'Developed high-concurrency Go microservice handling 4,000 req/sec with PostgreSQL connection pooling and structured tracing.',
                },
            ],
        },
    });

    // Education for Amine
    const eduAmine = await prisma.vaultEducation.create({
        data: {
            userId: candidatePro.id,
            degree: 'Master 2 Systèmes Informatiques Distribués',
            institution: 'USTHB Bab Ezzouar',
            field: 'Big Data & Cloud',
            startDate: '2020',
            endDate: '2025',
        },
    });

    // Vault Project for Amine
    const projAmine = await prisma.vaultProject.create({
        data: {
            userId: candidatePro.id,
            title: 'Distributed Kafka ETL Pipeline',
            projectUrl: 'https://github.com/amine-khelifi/kafka-etl',
            tags: ['Python', 'Kafka', 'PostgreSQL', 'Docker'],
            narratives: [
                {
                    label: 'Data Engineering Focus',
                    text: 'Built streaming consumer pipeline ingesting 15k messages/min into partitioned PostgreSQL tables with zero message loss.',
                },
                {
                    label: 'Security & Integrity Focus',
                    text: 'Implemented mTLS authentication and encrypted payload serialization across Kafka cluster brokers.',
                },
            ],
        },
    });

    // Education for Yasmine
    const eduYasmine = await prisma.vaultEducation.create({
        data: {
            userId: candidateLegal.id,
            degree: 'Master 2 Droit des Affaires',
            institution: 'Faculté de Droit de Ben Aknoun (Alger 1)',
            field: 'Droit Commercial & Bancaire',
            startDate: '2018',
            endDate: '2023',
        },
    });

    // Certification for Yasmine
    const certYasmine = await prisma.vaultCertification.create({
        data: {
            userId: candidateLegal.id,
            name: 'Certificat d’Aptitude à la Profession d’Avocat (CAPA)',
            issuer: 'Ordre National des Avocats (Barreau d’Alger)',
            issueDate: '2024',
        },
    });

    console.log(
        '✅ Created Vault Items (Education, Projects with Angles, Certifications)'
    );

    // 5. Create Tailored Personas (Profiles)
    // Samy's Persona (Cloud Infrastructure)
    const profileCloud = await prisma.applicantProfile.create({
        data: {
            userId: candidateFree.id,
            title: 'Junior Cloud Infrastructure Engineer',
            resumeUrl: 'https://skillora.dz/resumes/samy-benali-cloud.pdf',
            summary:
                'State Engineer in CS from ESI Algiers. Specialized in Linux administration, Docker containerization, and automated CI/CD workflows.',
            skills: [
                'Docker',
                'Linux Admin',
                'CI/CD',
                'Bash',
                'Terraform',
                'Go',
            ],
            selectedEducationIds: [eduSamy.id],
            selectedProjectAngles: [
                {
                    projectId: projSamy.id,
                    selectedNarrativeLabel: 'Systems & DevOps Angle',
                },
            ],
        },
    });

    // Amine's Persona 1: Data Engineer
    const profileData = await prisma.applicantProfile.create({
        data: {
            userId: candidatePro.id,
            title: 'Data & ETL Systems Engineer',
            resumeUrl: 'https://skillora.dz/resumes/amine-khelifi-data.pdf',
            summary:
                'Master 2 graduate from USTHB. Specialized in distributed pipelines, PostgreSQL, and Kafka messaging.',
            skills: ['Python', 'PostgreSQL', 'Kafka', 'Docker'],
            selectedEducationIds: [eduAmine.id],
            selectedProjectAngles: [
                {
                    projectId: projAmine.id,
                    selectedNarrativeLabel: 'Data Engineering Focus',
                },
            ],
        },
    });

    // Amine's Persona 2: Security & Audit
    const profileSec = await prisma.applicantProfile.create({
        data: {
            userId: candidatePro.id,
            title: 'Junior Penetration Tester & Security Auditor',
            resumeUrl: 'https://skillora.dz/resumes/amine-khelifi-sec.pdf',
            summary:
                'Practitioner in defensive hardening, mTLS architectures, and OWASP audit methodologies.',
            skills: [
                'Network Security',
                'Burp Suite',
                'Python',
                'Linux Hardening',
            ],
            selectedEducationIds: [eduAmine.id],
            selectedProjectAngles: [
                {
                    projectId: projAmine.id,
                    selectedNarrativeLabel: 'Security & Integrity Focus',
                },
            ],
        },
    });

    // Yasmine's Persona (Legal Counsel)
    const profileLaw = await prisma.applicantProfile.create({
        data: {
            userId: candidateLegal.id,
            title: 'Corporate Legal Counsel & Compliance Jurist',
            resumeUrl: 'https://skillora.dz/resumes/yasmine-meziane-legal.pdf',
            summary:
                'CAPA certified lawyer from Barreau d’Alger. Specialized in corporate contracts, banking compliance, and Algerian commercial codes.',
            skills: [
                'Droit des Affaires',
                'Contrats Commerciaux',
                'Conformité Bancaire',
            ],
            selectedEducationIds: [eduYasmine.id],
            selectedCertificationIds: [certYasmine.id],
        },
    });

    console.log('✅ Created Synthesized Personas with Vault Links');

    // 6. Create Positions
    const deadlineFuture1 = new Date();
    deadlineFuture1.setDate(deadlineFuture1.getDate() + 14);

    const pos1 = await prisma.position.create({
        data: {
            recruiterId: recruiter1.id,
            companyName: 'TechCorp DZ',
            title: 'Junior Cloud Infrastructure Engineer',
            department: 'Cloud & Systems',
            location: 'Algiers (Hybrid)',
            deadline: deadlineFuture1,
            status: PositionStatus.OPEN,
            rubric: {
                mandatoryCriteria: ['Docker', 'Linux Admin', 'CI/CD'],
                preferredCriteria: ['Go', 'Kubernetes'],
                minimumScoreThreshold: 70,
            },
        },
    });

    const deadlineFuture2 = new Date();
    deadlineFuture2.setDate(deadlineFuture2.getDate() + 21);

    const pos2 = await prisma.position.create({
        data: {
            recruiterId: recruiter1.id,
            companyName: 'TechCorp DZ',
            title: 'Backend Systems Developer (Go/PostgreSQL)',
            department: 'Core Infrastructure',
            location: 'Kouba, Algiers',
            deadline: deadlineFuture2,
            status: PositionStatus.OPEN,
            rubric: {
                mandatoryCriteria: ['Go', 'PostgreSQL', 'Docker'],
                preferredCriteria: ['Microservices'],
                minimumScoreThreshold: 75,
            },
        },
    });

    const deadlineFuture3 = new Date();
    deadlineFuture3.setDate(deadlineFuture3.getDate() + 10);

    const pos3 = await prisma.position.create({
        data: {
            recruiterId: recruiter2.id,
            companyName: "Banque d'Algérie",
            title: 'Juriste Droit Bancaire & Conformité',
            department: 'Affaires Juridiques',
            location: 'Algiers (On-site)',
            deadline: deadlineFuture3,
            status: PositionStatus.OPEN,
            rubric: {
                mandatoryCriteria: [
                    'Droit des Affaires',
                    'Contrats Commerciaux',
                ],
                preferredCriteria: ['Conformité Bancaire'],
                minimumScoreThreshold: 70,
            },
        },
    });

    const deadlinePast = new Date();
    deadlinePast.setDate(deadlinePast.getDate() - 5);

    await prisma.position.create({
        data: {
            recruiterId: recruiter1.id,
            companyName: 'TechCorp DZ',
            title: 'Site Reliability Engineer (2025 Cohort)',
            department: 'Cloud & Systems',
            location: 'Algiers',
            deadline: deadlinePast,
            status: PositionStatus.CLOSED,
            rubric: {
                mandatoryCriteria: ['Kubernetes', 'Prometheus'],
                minimumScoreThreshold: 80,
            },
        },
    });

    console.log('✅ Created Positions (3 Open, 1 Closed Archive)');

    // 7. Create Applications & Evaluations
    // App 1: Samy Benali -> Shortlisted / Interview Pending
    const app1 = await prisma.application.create({
        data: {
            positionId: pos1.id,
            applicantId: candidateFree.id,
            profileId: profileCloud.id,
            anonymousId: 'DZ-308',
            status: ApplicationStatus.INTERVIEW_PENDING,
            matchScore: 94,
            rubricAudit: {
                mandatoryCriteriaAudit: [
                    {
                        criterion: 'Docker',
                        satisfied: true,
                        evidenceFound:
                            'Verified artifact: Cloud Infrastructure Orchestrator',
                    },
                    {
                        criterion: 'Linux Admin',
                        satisfied: true,
                        evidenceFound: 'Verified competency in Linux Admin',
                    },
                    {
                        criterion: 'CI/CD',
                        satisfied: true,
                        evidenceFound:
                            'Verified artifact: Systems & DevOps Angle',
                    },
                ],
                strengths: ['Docker', 'Linux Admin', 'CI/CD', 'Preferred: Go'],
                unmetRequirements: [],
            },
        },
    });

    // Proposed interview slots for Samy
    const nextTue = new Date();
    nextTue.setDate(nextTue.getDate() + ((2 + 7 - nextTue.getDay()) % 7 || 7));
    nextTue.setHours(14, 0, 0, 0);

    const nextThu = new Date();
    nextThu.setDate(nextThu.getDate() + ((4 + 7 - nextThu.getDay()) % 7 || 7));
    nextThu.setHours(10, 30, 0, 0);

    await prisma.interviewEvent.create({
        data: {
            applicationId: app1.id,
            applicantId: candidateFree.id,
            recruiterId: recruiter1.id,
            status: InterviewStatus.RANGE_PENDING,
            proposedRanges: [
                {
                    startTime: nextTue.toISOString(),
                    endTime: new Date(
                        nextTue.getTime() + 60 * 60 * 1000
                    ).toISOString(),
                    format: 'video_meet',
                },
                {
                    startTime: nextThu.toISOString(),
                    endTime: new Date(
                        nextThu.getTime() + 60 * 60 * 1000
                    ).toISOString(),
                    format: 'video_meet',
                },
            ],
        },
    });

    // App 2: Amine Khelifi -> Redirected with Actionable Gap Analysis
    await prisma.application.create({
        data: {
            positionId: pos1.id,
            applicantId: candidatePro.id,
            profileId: profileData.id,
            anonymousId: 'DZ-309',
            status: ApplicationStatus.REDIRECTED,
            matchScore: 52,
            rubricAudit: {
                mandatoryCriteriaAudit: [
                    {
                        criterion: 'Docker',
                        satisfied: true,
                        evidenceFound: 'Verified competency in Docker',
                    },
                    {
                        criterion: 'Linux Admin',
                        satisfied: false,
                        evidenceFound: null,
                    },
                    {
                        criterion: 'CI/CD',
                        satisfied: false,
                        evidenceFound: null,
                    },
                ],
                strengths: ['Docker'],
                unmetRequirements: ['Linux Admin', 'CI/CD'],
            },
            gapAnalysis: {
                badge: 'ACTIONABLE GAP ANALYSIS [ZERO GHOSTING]',
                headlineReason:
                    'Why your profile was not selected for this cohort (Junior Cloud Infrastructure Engineer)',
                verifiedStrengths: [
                    'Docker',
                    'Python',
                    'PostgreSQL database administration',
                ],
                unmetMandatoryReasons: [
                    'Missing mandatory requirement: Linux Admin',
                    'Missing mandatory requirement: CI/CD',
                ],
                recommendedBridgePath: {
                    title: 'Deploy a microservice with automated GitHub Actions CI/CD pipeline',
                    actionableMilestones: [
                        'Configure a GitHub repository with an automated build & test workflow for your ETL scripts.',
                        'Deploy to a standalone Linux virtual machine (Ubuntu/Debian) with automated systemd daemon configuration.',
                    ],
                    reapplicationReadinessMilestone:
                        'Push to a public repository and link the verified repo on your next application.',
                },
            },
        },
    });

    // App 3: Yasmine Meziane -> Eligible
    await prisma.application.create({
        data: {
            positionId: pos3.id,
            applicantId: candidateLegal.id,
            profileId: profileLaw.id,
            anonymousId: 'DZ-310',
            status: ApplicationStatus.ELIGIBLE,
            matchScore: 92,
            rubricAudit: {
                mandatoryCriteriaAudit: [
                    {
                        criterion: 'Droit des Affaires',
                        satisfied: true,
                        evidenceFound: 'CAPA & Master 2 Droit des Affaires',
                    },
                    {
                        criterion: 'Contrats Commerciaux',
                        satisfied: true,
                        evidenceFound: 'Verified drafting experience',
                    },
                ],
                strengths: [
                    'Droit des Affaires',
                    'Contrats Commerciaux',
                    'CAPA Alger',
                ],
                unmetRequirements: [],
            },
        },
    });

    console.log(
        '✅ Created Applications with Interview Schedules & Actionable Gap Analysis'
    );
    console.log('\n🎉 Seeding Completed! Login credentials:');
    console.log('------------------------------------------------------------');
    console.log('👉 Recruiter:  recruiter@techcorp.dz   / password123');
    console.log('👉 Candidate 1 (Free): samy.benali@esi.dz    / password123');
    console.log('👉 Candidate 2 (Pro):  amine.khelifi@gmail.com / password123');
    console.log(
        '👉 Candidate 3 (Legal): yasmine.meziane@avocat.dz / password123'
    );
    console.log('------------------------------------------------------------');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
