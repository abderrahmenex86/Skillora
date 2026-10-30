import type { ApplicationStatus, CompanyStatus } from '@prisma/client';

export const TEST_DOMAIN = '@skillora.test';
export const TEST_PASSWORD = 'password123';

export const ADMIN_EMAILS = [`admin${TEST_DOMAIN}`, `admin2${TEST_DOMAIN}`] as const;

/** Every position gets this many recruiter slots and interview seats. */
export const RECRUITER_SLOTS_PER_POSITION = 3;

export type BranchSeed = {
    label: string;
    wilaya: string;
    address: string;
    isHeadquarters: boolean;
};

export type CompanySeed = {
    name: string;
    status: CompanyStatus;
    employeeCount: number;
    industry: string;
    website: string;
    description: string;
    recruiterIndexes: number[];
    departments: string[];
    branches: BranchSeed[];
};

export type RecruiterSeed = {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    wilaya: string;
    companyIndex: number;
};

export type PositionSeed = {
    title: string;
    companyIndex: number;
    recruiterIndex: number;
    department: string;
    branchLabel: string;
    location: string;
    description: string;
    minimumYearsExperience: number;
    interviewCapacity: number;
    rubric: {
        mandatoryCriteria: string[];
        preferredCriteria: string[];
        minimumScoreThreshold: number;
    };
};

export type ApplicantSeed = {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    wilaya: string;
    title: string;
    summary: string;
    skills: string[];
    education: {
        degree: string;
        institution: string;
        field: string;
        startDate: string;
        endDate: string;
    };
    experience: {
        company: string;
        role: string;
        location: string;
        startDate: string;
        endDate: string | null;
        highlights: string[];
    };
    project: {
        title: string;
        projectUrl: string;
        description: string;
        date: string;
        tags: string[];
        narratives: {
            challenge: string;
            action: string;
            result: string;
        };
    };
    certification: {
        name: string;
        issuer: string;
        issueDate: string;
        credentialId: string;
    };
    link: {
        label: string;
        url: string;
        type: string;
    };
};

export type ApplicationPlanEntry = {
    positionIndex: number;
    applicantIndex: number;
    slotIndex: number;
};

export const COMPANIES: CompanySeed[] = [
    {
        name: 'Atlas Cloud',
        status: 'APPROVED',
        employeeCount: 180,
        industry: 'Cloud infrastructure',
        website: 'https://atlas-cloud.example',
        description:
            'Atlas Cloud builds reliable cloud infrastructure for Algerian enterprises, from managed compute to observability.',
        recruiterIndexes: [0, 1, 2],
        departments: ['Cloud & Systems', 'Platform Reliability', 'Developer Experience'],
        branches: [
            {
                label: 'Algiers HQ',
                wilaya: '16 - Alger',
                address: '12 Rue Didouche Mourad, Algiers',
                isHeadquarters: true,
            },
            {
                label: 'Oran Office',
                wilaya: '31 - Oran',
                address: '8 Boulevard de la Soummam, Oran',
                isHeadquarters: false,
            },
            {
                label: 'Constantine Office',
                wilaya: '25 - Constantine',
                address: '4 Avenue Aouati Mostefa, Constantine',
                isHeadquarters: false,
            },
        ],
    },
    {
        name: 'Numidia Systems',
        status: 'APPROVED',
        employeeCount: 95,
        industry: 'Enterprise software',
        website: 'https://numidia-systems.example',
        description:
            'Numidia Systems designs core banking and data platforms for financial institutions across North Africa.',
        recruiterIndexes: [3],
        departments: ['Core Services', 'Data Engineering'],
        branches: [
            {
                label: 'Algiers HQ',
                wilaya: '16 - Alger',
                address: '22 Rue Larbi Ben M’hidi, Algiers',
                isHeadquarters: true,
            },
            {
                label: 'Sétif Office',
                wilaya: '19 - Sétif',
                address: '6 Avenue de l’ALN, Sétif',
                isHeadquarters: false,
            },
        ],
    },
    {
        name: 'Tell Platform',
        status: 'APPROVED',
        employeeCount: 120,
        industry: 'Commerce technology',
        website: 'https://tell-platform.example',
        description:
            'Tell Platform connects local businesses with customers through a modern commerce and messaging suite.',
        recruiterIndexes: [4],
        departments: ['Product Engineering', 'Mobile'],
        branches: [
            {
                label: 'Oran HQ',
                wilaya: '31 - Oran',
                address: '15 Rue Larbi Ben M’hidi, Oran',
                isHeadquarters: true,
            },
            {
                label: 'Algiers Office',
                wilaya: '16 - Alger',
                address: '3 Rue des Frères Bouadou, Algiers',
                isHeadquarters: false,
            },
        ],
    },
    {
        name: 'Sahara Fintech',
        status: 'APPROVED',
        employeeCount: 140,
        industry: 'Financial technology',
        website: 'https://sahara-fintech.example',
        description:
            'Sahara Fintech builds payment and risk tooling for merchants who need fast, compliant settlement.',
        recruiterIndexes: [5],
        departments: ['Payments', 'Risk & Compliance'],
        branches: [
            {
                label: 'Algiers HQ',
                wilaya: '16 - Alger',
                address: '7 Chemin Mohamed Drareni, Algiers',
                isHeadquarters: true,
            },
            {
                label: 'Blida Office',
                wilaya: '09 - Blida',
                address: '11 Boulevard Larbi Tebessi, Blida',
                isHeadquarters: false,
            },
        ],
    },
    {
        name: 'Cedar Mobility',
        status: 'PENDING',
        employeeCount: 60,
        industry: 'Urban mobility',
        website: 'https://cedar-mobility.example',
        description:
            'Cedar Mobility is building cleaner urban transport, starting with electric fleets and smart routing.',
        recruiterIndexes: [6],
        departments: ['Operations', 'Fleet Technology'],
        branches: [
            {
                label: 'Constantine HQ',
                wilaya: '25 - Constantine',
                address: '9 Rue Belouizdad, Constantine',
                isHeadquarters: true,
            },
            {
                label: 'Annaba Office',
                wilaya: '23 - Annaba',
                address: '2 Cours de la Révolution, Annaba',
                isHeadquarters: false,
            },
        ],
    },
    {
        name: 'Aurassi Energy',
        status: 'PENDING',
        employeeCount: 75,
        industry: 'Renewable energy',
        website: 'https://aurassi-energy.example',
        description:
            'Aurassi Energy modernises energy operations with field monitoring and distributed generation software.',
        recruiterIndexes: [7],
        departments: ['Energy Systems', 'Field Operations'],
        branches: [
            {
                label: 'Tizi Ouzou HQ',
                wilaya: '15 - Tizi Ouzou',
                address: '5 Boulevard Stiti, Tizi Ouzou',
                isHeadquarters: true,
            },
            {
                label: 'Ouargla Office',
                wilaya: '30 - Ouargla',
                address: '1 Route de l’Aéroport, Ouargla',
                isHeadquarters: false,
            },
        ],
    },
];

export const RECRUITERS: RecruiterSeed[] = [
    {
        email: `e2e.recruiter1${TEST_DOMAIN}`,
        firstName: 'Aymen',
        lastName: 'Bensalem',
        phone: '+213 550 10 00 01',
        wilaya: '16 - Alger',
        companyIndex: 0,
    },
    {
        email: `e2e.recruiter2${TEST_DOMAIN}`,
        firstName: 'Lina',
        lastName: 'Cherif',
        phone: '+213 550 10 00 02',
        wilaya: '16 - Alger',
        companyIndex: 0,
    },
    {
        email: `e2e.recruiter3${TEST_DOMAIN}`,
        firstName: 'Yacine',
        lastName: 'Bouzid',
        phone: '+213 550 10 00 03',
        wilaya: '31 - Oran',
        companyIndex: 0,
    },
    {
        email: `e2e.recruiter4${TEST_DOMAIN}`,
        firstName: 'Nadia',
        lastName: 'Rahmani',
        phone: '+213 550 10 00 04',
        wilaya: '16 - Alger',
        companyIndex: 1,
    },
    {
        email: `e2e.recruiter5${TEST_DOMAIN}`,
        firstName: 'Sofiane',
        lastName: 'Meziane',
        phone: '+213 550 10 00 05',
        wilaya: '31 - Oran',
        companyIndex: 2,
    },
    {
        email: `e2e.recruiter6${TEST_DOMAIN}`,
        firstName: 'Imane',
        lastName: 'Boudiaf',
        phone: '+213 550 10 00 06',
        wilaya: '16 - Alger',
        companyIndex: 3,
    },
    {
        email: `e2e.pending${TEST_DOMAIN}`,
        firstName: 'Karim',
        lastName: 'Belkacem',
        phone: '+213 550 10 00 07',
        wilaya: '25 - Constantine',
        companyIndex: 4,
    },
    {
        email: `e2e.pending2${TEST_DOMAIN}`,
        firstName: 'Meriem',
        lastName: 'Saidi',
        phone: '+213 550 10 00 08',
        wilaya: '15 - Tizi Ouzou',
        companyIndex: 5,
    },
];

export const POSITIONS: PositionSeed[] = [
    {
        title: 'Cloud Infrastructure Engineer',
        companyIndex: 0,
        recruiterIndex: 0,
        department: 'Cloud & Systems',
        branchLabel: 'Algiers HQ',
        location: 'Algiers HQ · 16 - Alger',
        description:
            'Own our cloud infrastructure across Docker, Linux, and CI/CD. You will build reliable deployment pipelines, harden production systems, and partner with product teams on capacity and reliability.',
        minimumYearsExperience: 3,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['Docker', 'Linux', 'CI/CD'],
            preferredCriteria: ['Kubernetes', 'Terraform'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'Site Reliability Engineer',
        companyIndex: 0,
        recruiterIndex: 0,
        department: 'Platform Reliability',
        branchLabel: 'Oran Office',
        location: 'Oran Office · 31 - Oran',
        description:
            'Keep Atlas Cloud services fast and available. You will define service objectives, lead incident response, and automate the observability stack that every product team depends on.',
        minimumYearsExperience: 4,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['Linux', 'Kubernetes', 'Prometheus'],
            preferredCriteria: ['Go', 'Incident Response'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'DevOps Engineer',
        companyIndex: 0,
        recruiterIndex: 0,
        department: 'Developer Experience',
        branchLabel: 'Algiers HQ',
        location: 'Algiers HQ · 16 - Alger',
        description:
            'Improve how Atlas Cloud ships software. You will maintain Terraform modules, streamline CI/CD pipelines, and coach teams on safe, repeatable releases.',
        minimumYearsExperience: 3,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['Docker', 'Terraform', 'CI/CD'],
            preferredCriteria: ['AWS', 'GitOps'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'Backend Developer',
        companyIndex: 0,
        recruiterIndex: 1,
        department: 'Cloud & Systems',
        branchLabel: 'Constantine Office',
        location: 'Constantine Office · 25 - Constantine',
        description:
            'Design and ship Go services backed by PostgreSQL and Docker. You will own APIs, data models, and production reliability for the core platform while collaborating with product and data teams.',
        minimumYearsExperience: 2,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['Go', 'PostgreSQL', 'Docker'],
            preferredCriteria: ['Microservices', 'Kafka'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'API Engineer',
        companyIndex: 0,
        recruiterIndex: 1,
        department: 'Cloud & Systems',
        branchLabel: 'Oran Office',
        location: 'Oran Office · 31 - Oran',
        description:
            'Build the public and internal APIs that power Atlas Cloud integrations. You will shape contracts, document endpoints, and keep latency and error budgets under control.',
        minimumYearsExperience: 2,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['TypeScript', 'Node.js', 'REST APIs'],
            preferredCriteria: ['GraphQL', 'PostgreSQL'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'Platform Engineer',
        companyIndex: 0,
        recruiterIndex: 2,
        department: 'Platform Reliability',
        branchLabel: 'Algiers HQ',
        location: 'Algiers HQ · 16 - Alger',
        description:
            'Build the internal platform on Linux, Kubernetes, and Terraform. You will automate environments, improve developer experience across teams, and make reliable delivery the default.',
        minimumYearsExperience: 4,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['Linux', 'Kubernetes', 'Terraform'],
            preferredCriteria: ['AWS', 'CI/CD'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'Frontend Engineer',
        companyIndex: 0,
        recruiterIndex: 2,
        department: 'Developer Experience',
        branchLabel: 'Constantine Office',
        location: 'Constantine Office · 25 - Constantine',
        description:
            'Create accessible, fast interfaces for Atlas Cloud customers. You will work in React and TypeScript, pair with designers, and raise the quality bar for frontend testing.',
        minimumYearsExperience: 2,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['React', 'TypeScript', 'CSS'],
            preferredCriteria: ['Next.js', 'Testing'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'Data Engineer',
        companyIndex: 1,
        recruiterIndex: 3,
        department: 'Data Engineering',
        branchLabel: 'Algiers HQ',
        location: 'Algiers HQ · 16 - Alger',
        description:
            "Build the batch and streaming pipelines behind Numidia's data platform. You will model warehouse tables, orchestrate Airflow DAGs, and make data trustworthy for analysts.",
        minimumYearsExperience: 3,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['Python', 'SQL', 'Airflow'],
            preferredCriteria: ['Spark', 'dbt'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'Backend Engineer',
        companyIndex: 1,
        recruiterIndex: 3,
        department: 'Core Services',
        branchLabel: 'Sétif Office',
        location: 'Sétif Office · 19 - Sétif',
        description:
            "Develop Java services for Numidia's core banking platform. You will design resilient transactions, tune PostgreSQL queries, and work closely with risk and operations teams.",
        minimumYearsExperience: 3,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['Java', 'Spring Boot', 'PostgreSQL'],
            preferredCriteria: ['Kafka', 'Docker'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'Machine Learning Engineer',
        companyIndex: 1,
        recruiterIndex: 3,
        department: 'Data Engineering',
        branchLabel: 'Algiers HQ',
        location: 'Algiers HQ · 16 - Alger',
        description:
            'Turn lending and risk data into production models. You will train and evaluate PyTorch models, build MLOps workflows, and monitor drift after deployment.',
        minimumYearsExperience: 3,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['Python', 'PyTorch', 'MLOps'],
            preferredCriteria: ['Docker', 'LLMs'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'Mobile Engineer',
        companyIndex: 2,
        recruiterIndex: 4,
        department: 'Mobile',
        branchLabel: 'Oran HQ',
        location: 'Oran HQ · 31 - Oran',
        description:
            "Build Tell's Android experience in Kotlin and Jetpack Compose. You will ship polished flows, improve offline behaviour, and collaborate with backend and design partners.",
        minimumYearsExperience: 3,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['Kotlin', 'Android', 'Jetpack Compose'],
            preferredCriteria: ['Swift', 'CI/CD'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'Product Engineer',
        companyIndex: 2,
        recruiterIndex: 4,
        department: 'Product Engineering',
        branchLabel: 'Algiers Office',
        location: 'Algiers Office · 16 - Alger',
        description:
            "Own end-to-end product features across the Tell stack. You will move between TypeScript, React, and Node.js to ship experiments and improve the merchant journey.",
        minimumYearsExperience: 2,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['TypeScript', 'React', 'Node.js'],
            preferredCriteria: ['PostgreSQL', 'Design Systems'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'QA Automation Engineer',
        companyIndex: 2,
        recruiterIndex: 4,
        department: 'Product Engineering',
        branchLabel: 'Oran HQ',
        location: 'Oran HQ · 31 - Oran',
        description:
            "Protect Tell's release quality with reliable Playwright suites. You will grow CI coverage, investigate flaky tests, and partner with engineers on fast feedback loops.",
        minimumYearsExperience: 2,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['Playwright', 'TypeScript', 'CI/CD'],
            preferredCriteria: ['Docker', 'Performance Testing'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'Payments Engineer',
        companyIndex: 3,
        recruiterIndex: 5,
        department: 'Payments',
        branchLabel: 'Algiers HQ',
        location: 'Algiers HQ · 16 - Alger',
        description:
            'Build settlement and reconciliation services for Sahara merchants. You will design idempotent payment flows, strengthen PostgreSQL schemas, and keep compliance visible in code.',
        minimumYearsExperience: 4,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['Java', 'PostgreSQL', 'Payment Systems'],
            preferredCriteria: ['Kafka', 'PCI DSS'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'Risk Analyst',
        companyIndex: 3,
        recruiterIndex: 5,
        department: 'Risk & Compliance',
        branchLabel: 'Blida Office',
        location: 'Blida Office · 09 - Blida',
        description:
            "Investigate fraud and credit signals across Sahara's merchant network. You will write SQL models, document risk rules, and turn findings into clear operational recommendations.",
        minimumYearsExperience: 2,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['SQL', 'Risk Modeling', 'Fraud Detection'],
            preferredCriteria: ['Python', 'Reporting'],
            minimumScoreThreshold: 70,
        },
    },
    {
        title: 'Security Engineer',
        companyIndex: 3,
        recruiterIndex: 5,
        department: 'Risk & Compliance',
        branchLabel: 'Algiers HQ',
        location: 'Algiers HQ · 16 - Alger',
        description:
            "Harden Sahara's payment platform and internal systems. You will lead threat modelling, review IAM policies, and guide teams through secure cloud and incident-response practices.",
        minimumYearsExperience: 3,
        interviewCapacity: RECRUITER_SLOTS_PER_POSITION,
        rubric: {
            mandatoryCriteria: ['Security', 'OWASP', 'IAM'],
            preferredCriteria: ['Cloud Security', 'Incident Response'],
            minimumScoreThreshold: 70,
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
    'Meriem',
    'Karim',
    'Sofia',
];

const LAST_NAMES = [
    'Benali',
    'Khelifi',
    'Bouzid',
    'Mansouri',
    'Haddad',
    'Cherif',
    'Rahmani',
    'Bensalem',
    'Meziane',
    'Boudiaf',
];

const WILAYAS = [
    '16 - Alger',
    '31 - Oran',
    '25 - Constantine',
    '19 - Sétif',
    '09 - Blida',
    '23 - Annaba',
    '15 - Tizi Ouzou',
    '30 - Ouargla',
    '06 - Béjaïa',
    '13 - Tlemcen',
];

const TITLES = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Cloud Engineer',
    'Data Analyst',
    'Mobile Developer',
    'DevOps Engineer',
    'QA Engineer',
    'Security Analyst',
    'Platform Engineer',
];

const SKILLS_BY_TITLE: Record<string, string[]> = {
    'Frontend Developer': ['TypeScript', 'React', 'CSS', 'Testing', 'Git'],
    'Backend Developer': ['Node.js', 'PostgreSQL', 'Docker', 'REST APIs', 'Git'],
    'Full Stack Developer': ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
    'Cloud Engineer': ['Linux', 'Docker', 'Kubernetes', 'Terraform', 'AWS'],
    'Data Analyst': ['SQL', 'Python', 'Data Visualization', 'Statistics', 'Excel'],
    'Mobile Developer': ['Kotlin', 'Android', 'Jetpack Compose', 'Git', 'REST APIs'],
    'DevOps Engineer': ['Linux', 'CI/CD', 'Docker', 'Terraform', 'AWS'],
    'QA Engineer': ['Playwright', 'TypeScript', 'Testing', 'CI/CD', 'Git'],
    'Security Analyst': ['Security', 'OWASP', 'Linux', 'Python', 'Incident Response'],
    'Platform Engineer': ['Kubernetes', 'Linux', 'Terraform', 'Go', 'CI/CD'],
};

const DEGREES = [
    'Licence in Computer Science',
    'Master in Software Engineering',
    'Licence in Information Systems',
    'Master in Data Science',
    'Engineering Degree in Computer Science',
    'Licence in Mathematics',
    'Master in Cybersecurity',
    'Engineering Degree in Telecommunications',
];

const INSTITUTIONS = [
    'USTHB, Algiers',
    'University of Oran 1',
    'University of Constantine 2',
    'Ferhat Abbas University, Sétif',
    'University of Blida 1',
    'Badji Mokhtar University, Annaba',
    'University of Tizi Ouzou',
    'Kasdi Merbah University, Ouargla',
];

const FIELDS = [
    'Computer Science',
    'Software Engineering',
    'Information Systems',
    'Data Science',
    'Applied Mathematics',
    'Cybersecurity',
    'Telecommunications',
    'Artificial Intelligence',
];

const EXPERIENCE_COMPANIES = [
    'Casbah Digital',
    'Numidia Labs',
    'Tell Studio',
    'Sahara Pay',
    'Cedar Labs',
    'Aurassi Tech',
    'Medina Software',
    'Rif Systems',
];

const PROJECT_TITLES = [
    'Operations Dashboard',
    'Payment Reconciliation Service',
    'Route Planning Companion',
    'Candidate Matching Sandbox',
    'Field Data Collection App',
    'Cloud Cost Explorer',
    'Fraud Signal Notebook',
    'Accessible Storefront',
];

const CERTIFICATIONS = [
    { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services' },
    { name: 'Google Data Analytics Certificate', issuer: 'Google' },
    { name: 'Meta Front-End Developer Certificate', issuer: 'Meta' },
    { name: 'Certified Kubernetes Administrator', issuer: 'CNCF' },
    { name: 'Microsoft Azure Fundamentals', issuer: 'Microsoft' },
    { name: 'Professional Scrum Master I', issuer: 'Scrum.org' },
    { name: 'CompTIA Security+', issuer: 'CompTIA' },
    { name: 'HashiCorp Terraform Associate', issuer: 'HashiCorp' },
];

const SUMMARY_BUILDERS = [
    (title: string) =>
        `Early-career ${title.toLowerCase()} with hands-on project experience and a focus on clean, tested delivery.`,
    (title: string) =>
        `${title} with a portfolio of practical projects across web platforms and internal tools.`,
    (title: string) =>
        `Curious ${title.toLowerCase()} who enjoys turning ambiguous requirements into dependable, well-documented software.`,
    (title: string) =>
        `${title} focused on measurable outcomes, clear communication, and maintainable systems.`,
];

export const APPLICANTS: ApplicantSeed[] = Array.from({ length: 100 }, (_, index) => {
    const number = index + 1;
    const title = TITLES[index % TITLES.length];
    const skills = SKILLS_BY_TITLE[title];
    const graduationYear = 2018 + (index % 6);
    const certification = CERTIFICATIONS[index % CERTIFICATIONS.length];
    const projectTitle = PROJECT_TITLES[index % PROJECT_TITLES.length];
    const portfolioUrl = `https://portfolio.skillora.test/applicant-${String(number).padStart(3, '0')}`;

    return {
        email: `e2e.applicant${String(number).padStart(2, '0')}${TEST_DOMAIN}`,
        firstName: FIRST_NAMES[index % FIRST_NAMES.length],
        lastName: LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length],
        phone: `+213 550 40 ${String(number).padStart(2, '0')} ${String((index % 10) + 1).padStart(2, '0')}`,
        wilaya: WILAYAS[index % WILAYAS.length],
        title,
        summary: SUMMARY_BUILDERS[index % SUMMARY_BUILDERS.length](title),
        skills: [...skills],
        education: {
            degree: DEGREES[index % DEGREES.length],
            institution: INSTITUTIONS[index % INSTITUTIONS.length],
            field: FIELDS[index % FIELDS.length],
            startDate: `${graduationYear - 4}-09`,
            endDate: `${graduationYear}-06`,
        },
        experience: {
            company: EXPERIENCE_COMPANIES[index % EXPERIENCE_COMPANIES.length],
            role: title,
            location: WILAYAS[index % WILAYAS.length],
            startDate: `${graduationYear}-09`,
            endDate: null,
            highlights: [
                `Delivered ${title.toLowerCase()} features used by internal and customer-facing teams.`,
                `Worked daily with ${skills[0]} and ${skills[1]} in a production codebase.`,
            ],
        },
        project: {
            title: projectTitle,
            projectUrl: `${portfolioUrl}/projects/${projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            description: `A ${title.toLowerCase()} portfolio project focused on ${skills[2].toLowerCase()} and measurable user outcomes.`,
            date: `${2023 + (index % 3)}`,
            tags: skills.slice(0, 3),
            narratives: {
                challenge: `The team needed a dependable ${title.toLowerCase()} workflow without adding operational overhead.`,
                action: `Designed and built the feature with ${skills[0]}, ${skills[1]}, and ${skills[3]}, then validated it with users.`,
                result: 'Shipped a documented release that reduced manual work and improved delivery confidence.',
            },
        },
        certification: {
            name: certification.name,
            issuer: certification.issuer,
            issueDate: `${2022 + (index % 4)}-${String((index % 12) + 1).padStart(2, '0')}`,
            credentialId: `SKL-${String(number).padStart(4, '0')}-${index % 10}`,
        },
        link: {
            label: 'Portfolio',
            url: portfolioUrl,
            type: 'portfolio',
        },
    };
});

export function deadlineOffsetFor(positionIndex: number): number {
    return Math.round(1 + (29 * positionIndex) / 15);
}

export function buildApplicationPlan(): ApplicationPlanEntry[] {
    const plan: ApplicationPlanEntry[] = [];
    const nextSlotByPosition = new Map<number, number>();

    const add = (positionIndex: number, applicantIndex: number) => {
        const slotIndex = nextSlotByPosition.get(positionIndex) ?? 0;
        plan.push({ positionIndex, applicantIndex, slotIndex });
        nextSlotByPosition.set(positionIndex, slotIndex + 1);
    };

    // Applicants 95-99 stay unassigned; applicants 0-4 apply a second time below.
    for (let applicantIndex = 0; applicantIndex < APPLICANTS.length - 5; applicantIndex += 1) {
        add(applicantIndex % POSITIONS.length, applicantIndex);
    }

    const secondApplicationPositions = [1, 2, 3, 0, 15];
    secondApplicationPositions.forEach((positionIndex, applicantIndex) => {
        add(positionIndex, applicantIndex);
    });

    return plan;
}

export function statusForSlot(
    slotIndex: number,
    applicationCount: number
): ApplicationStatus {
    if (slotIndex === 0) return 'INTERVIEW_SCHEDULED';
    if (slotIndex === 1) return 'NEEDS_REVIEW';
    if (slotIndex === 2) return 'ON_HOLD';
    if (slotIndex === 3 && applicationCount >= 7) return 'NEEDS_REVIEW';
    return 'REJECTED';
}

const PLANNED_APPLICATIONS = buildApplicationPlan();
const APPLICATIONS_BY_POSITION = new Map<number, number>();
const APPLICATIONS_BY_APPLICANT = new Map<number, number>();

for (const entry of PLANNED_APPLICATIONS) {
    APPLICATIONS_BY_POSITION.set(
        entry.positionIndex,
        (APPLICATIONS_BY_POSITION.get(entry.positionIndex) ?? 0) + 1
    );
    APPLICATIONS_BY_APPLICANT.set(
        entry.applicantIndex,
        (APPLICATIONS_BY_APPLICANT.get(entry.applicantIndex) ?? 0) + 1
    );
}

const PLANNED_STATUSES = PLANNED_APPLICATIONS.map((entry) =>
    statusForSlot(entry.slotIndex, APPLICATIONS_BY_POSITION.get(entry.positionIndex) ?? 0)
);

const countStatus = (status: ApplicationStatus) =>
    PLANNED_STATUSES.filter((plannedStatus) => plannedStatus === status).length;

export const SEED_PLAN = {
    admins: ADMIN_EMAILS.length,
    recruiters: RECRUITERS.length,
    companies: COMPANIES.length,
    approvedCompanies: COMPANIES.filter((company) => company.status === 'APPROVED').length,
    pendingCompanies: COMPANIES.filter((company) => company.status === 'PENDING').length,
    positions: POSITIONS.length,
    applicants: APPLICANTS.length,
    applications: PLANNED_APPLICATIONS.length,
    applicantsWithApplications: APPLICATIONS_BY_APPLICANT.size,
    applicantsWithoutApplications: APPLICANTS.length - APPLICATIONS_BY_APPLICANT.size,
    applicantsWithTwoApplications: [...APPLICATIONS_BY_APPLICANT.values()].filter(
        (count) => count === 2
    ).length,
    positionsWithSevenApplications: [...APPLICATIONS_BY_POSITION.values()].filter(
        (count) => count === 7
    ).length,
    positionsWithSixApplications: [...APPLICATIONS_BY_POSITION.values()].filter(
        (count) => count === 6
    ).length,
    scheduledInterviews: countStatus('INTERVIEW_SCHEDULED'),
    needsReview: countStatus('NEEDS_REVIEW'),
    onHold: countStatus('ON_HOLD'),
    rejected: countStatus('REJECTED'),
} as const;
