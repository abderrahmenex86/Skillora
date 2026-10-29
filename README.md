# Skillora

**Hiring shouldn't end in silence. Match talent on real evidence.**

Skillora is a full-stack recruitment platform built for the Algerian talent market. Instead of keyword filtering, it evaluates candidates against recruiter-defined rubrics and guarantees a deterministic outcome for every application: an interview invitation or an actionable learning roadmap.

Candidates build a reusable information library and tailored resumes, apply to open roles, confirm interview slots, and track their progress. Recruiters publish positions with evidence rubrics, review anonymized ranked candidates, and let the platform handle scheduling and feedback.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis&logoColor=white)

<img src="docs/assets/homepage.png" alt="Skillora homepage" width="100%" />

> The public homepage: evidence routing, an employer shortlist, and an applicant growth card.

---

## Table of contents

- [Why Skillora](#why-skillora)
- [Features](#features)
- [How it works](#how-it-works)
- [Architecture](#architecture)
- [Application evaluation pipeline](#application-evaluation-pipeline)
- [Data model](#data-model)
- [Information library](#information-library)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [API reference](#api-reference)
- [Pricing](#pricing)
- [Frontend routes](#frontend-routes)
- [Design system](#design-system)
- [Current limitations](#current-limitations)
- [License](#license)

---

## Why Skillora

Traditional applicant tracking systems reduce people to keyword matches. Strong candidates get filtered out, and rejected applicants rarely learn why.

Skillora is built around three principles:

1. **Evidence over keywords.** Applications are audited against mandatory and preferred criteria, with extracted artifacts, credentials, and experience.
2. **No ghosting.** Every evaluated application ends in an interview path or a concrete gap analysis with milestones.
3. **Reusable candidate data.** A candidate enters education, experience, projects, and credentials once, then assembles role-specific resumes from that master library.

---

## Features

### For candidates

- **Master information library** with 18 sections, including education, work experience, skills, languages, certifications, projects, publications, volunteering, and custom entries.
- **Tailored resumes** assembled from saved items, with per-role titles, summaries, and skill sets. The seven core categories are attachable to resumes; the extended sections live in the library.
- **Job explorer** with open positions, rubrics, deadlines, and required evidence.
- **Application dashboard** showing anonymous candidate IDs, statuses, match scores, and gap analyses.
- **Notification inbox** for application updates, interview-slot proposals, and confirmations.
- **Interview logistics**: confirm an agent-proposed slot directly from the dashboard calendar.
- **Pro insights**: recurrent unmet criteria, department benchmarks, and targeted recommendations across application rounds.
- **Profile and security settings**: edit personal details, change password, and switch between light and dark themes.

### For recruiters

- **Position management** with mandatory criteria, preferred criteria, a minimum score threshold, an application deadline, interview capacity, and an interview window.
- **Anonymized candidate pipeline** ranked by match score, with full resume previews built from selected candidate sections.
- **Manual decision override** before the deadline, with required reviewer notes.
- **Interview slot configuration** by weekday and time range.
- **Automated calendar dispatch** through the coordinator agent.
- **Company plans** billed monthly or annually.

### Platform

- JWT access and refresh tokens, bcrypt password hashing, and role-based route guards.
- Refresh token rotation with reuse detection and automatic session revocation.
- Zod validation at the API boundary and a centralized error handler.
- Helmet, CORS allowlisting, and HTTP-only refresh cookies.
- BullMQ + Redis background evaluation with retries and exponential backoff.
- Structured agent execution logs for every evaluation stage.
- Responsive layouts, dark/light theming, and a global error boundary.

---

## How it works

```mermaid
flowchart TD
    A[Recruiter publishes a position and rubric] --> B[Candidate builds a tailored resume from the master library]
    B --> C[Candidate applies with the selected resume]
    C --> D[Application is anonymized as DZ-xxx]
    D --> E[Ingestion agent extracts evidence]
    E --> F[Matcher agent audits the rubric]
    F --> G{Evaluation outcome}
    G -->|Eligible| H[Coordinator agent proposes interview slots]
    G -->|Needs review| I[Recruiter reviews the application]
    G -->|Redirected| J[Growth agent writes a gap roadmap]
    H --> K[Candidate confirms a slot]
    K --> L[Interview scheduled]
    I -->|Override: eligible| H
    I -->|Override: redirected| J
    J --> M[Candidate receives actionable next steps]
```

Every application produces a structured audit and a visible next step. Nothing ends in an unexplained rejection.

---

## Architecture

```mermaid
flowchart LR
    subgraph Client["Browser"]
        SPA["React SPA<br/>Vite · Router · TanStack Query · Zustand"]
    end

    subgraph API["Express API"]
        MW["Middleware<br/>JWT auth · Zod validation · errors"]
        AUTH["Auth module"]
        APP["Applicant module"]
        REC["Recruiter module"]
        PUB["Public module"]
    end

    subgraph Async["Background processing"]
        QUEUE["BullMQ queue"]
        WORKER["Evaluation worker"]
        ORCH["Agent orchestrator"]
        ING["Ingestion agent"]
        MAT["Matcher agent"]
        GRO["Growth agent"]
        COORD["Coordinator agent"]
    end

    PG[("PostgreSQL")]
    REDIS[("Redis")]

    SPA -->|"/api/v1"| MW
    MW --> AUTH
    MW --> APP
    MW --> REC
    MW --> PUB

    AUTH --> PG
    APP --> PG
    REC --> PG
    PUB --> PG

    APP -->|"enqueue evaluation"| QUEUE
    QUEUE --> REDIS
    REDIS --> WORKER
    WORKER --> ORCH
    ORCH --> ING
    ORCH --> MAT
    ORCH --> GRO
    ORCH --> COORD
    ING --> PG
    MAT --> PG
    GRO --> PG
    COORD --> PG
```

The API is stateless. The evaluation worker runs in the same Node process as the API (imported from `server.ts`), while Redis provides durable job delivery and retry semantics. If Redis is unreachable, applications still submit immediately and the evaluation runs inline in the background so local development does not stall.

---

## Application evaluation pipeline

```mermaid
sequenceDiagram
    autonumber
    actor C as Candidate
    actor R as Recruiter
    participant UI as React app
    participant API as Express API
    participant Q as BullMQ + Redis
    participant W as Evaluation worker
    participant O as Agent orchestrator
    participant DB as PostgreSQL

    R->>API: POST /recruiter/positions
    API->>DB: Create Position with rubric

    C->>UI: Assemble a tailored resume
    UI->>API: POST /applicant/profiles
    API->>DB: Create ApplicantProfile

    C->>UI: Apply to an open position
    UI->>API: POST /applicant/applications
    API->>DB: Create Application (SUBMITTED, anonymousId)
    API->>Q: Enqueue evaluation job
    API-->>UI: 201 Created

    Q->>W: Deliver job
    W->>O: evaluateApplication(applicationId)
    O->>DB: Set status EVALUATING
    O->>O: Ingestion extracts evidence
    O->>O: Matcher audits rubric

    alt Eligible
        O->>O: Coordinator proposes slots
        O->>DB: InterviewEvent (RANGE_PENDING)
        O->>DB: Status INTERVIEW_PENDING
    else Needs review
        O->>DB: Status NEEDS_REVIEW
    else Redirected
        O->>O: Growth agent builds roadmap
        O->>DB: Status REDIRECTED + gapAnalysis
    end

    C->>UI: Open dashboard calendar
    UI->>API: GET /applicant/calendar
    API-->>UI: Proposed slots
    C->>API: POST /applicant/interviews/select-range
    API->>DB: InterviewEvent SLOT_CONFIRMED
    API->>DB: Application INTERVIEW_SCHEDULED
```

Each agent writes an `AgentExecutionLog` with its structured output, giving recruiters and operators a full audit trail.

### LLM adapter

All four agents resolve their model through a single factory in `backend/src/agents/model.factory.ts`, so switching providers is configuration-only:

| Provider | `LLM_PROVIDER` | Credentials | Default model |
|----------|----------------|-------------|---------------|
| Groq | `groq` | `GROQ_API_KEY` | `openai/gpt-oss-120b` |
| Ollama | `ollama` | `OLLAMA_BASE_URL` (OpenAI-compatible, default `http://localhost:11434/v1`) | `llama3.1:8b` |

Set `LLM_MODEL` to override the default for either provider. Each agent calls `generateObject` with its Zod schema and records the model that produced the result (`llm:groq:<model>` or `llm:ollama:<model>`).

- **Ingestion** strips PII, normalizes Algerian degrees and institutions, and extracts skills and verifiable artifacts from a resume-scoped dossier.
- **Matcher** audits every mandatory criterion against evidence and returns a 0–100 score with `ELIGIBLE`, `NEEDS_REVIEW`, or `REDIRECTED`.
- **Growth** writes the Zero-Ghosting roadmap for redirected candidates with domain-specific, artifact-producing milestones.
- **Coordinator** proposes slots from recruiter availability and builds the Google Meet payload when a slot is confirmed.

Candidate dossiers are built only from the vault entries selected on the resume. URLs are redacted before any prompt is sent, so personal handles never reach the model.

Every agent also has a deterministic heuristic fallback. If the provider is not configured or the model call fails, the pipeline continues and logs `heuristic-*` or `deterministic-*` as the `modelUsed` value.

> Groq's catalog changes per account. If a model such as `llama-3.3-70b-versatile` is not available, query `GET https://api.groq.com/openai/v1/models` and set `LLM_MODEL` to an available chat model.

---

## Data model

```mermaid
erDiagram
    User ||--o{ ApplicantProfile : owns
    User ||--o{ Application : submits
    User ||--o{ Position : posts
    User ||--o{ RefreshToken : holds
    User ||--o{ VaultEducation : stores
    User ||--o{ VaultExperience : stores
    User ||--o{ VaultProject : stores
    User ||--o{ VaultCertification : stores
    User ||--o{ VaultVolunteering : stores
    User ||--o{ VaultLanguage : stores
    User ||--o{ VaultLink : stores
    User ||--o{ VaultEntry : stores

    Position ||--o{ Application : receives
    Position ||--o{ RecruiterSlot : defines
    ApplicantProfile ||--o{ Application : used_by
    Application ||--o| InterviewEvent : schedules
    Application ||--o{ AgentExecutionLog : records

    User {
        string id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        string role
        string subscriptionTier
        datetime subscriptionExpiresAt
        string companyName
    }

    ApplicantProfile {
        string id PK
        string userId FK
        string title
        string summary
        json skills
        json selectedEducationIds
        json selectedExperienceIds
        json selectedProjectIds
        json selectedCertificationIds
    }

    Position {
        string id PK
        string recruiterId FK
        string companyName
        string title
        string department
        string location
        datetime deadline
        string status
        json rubric
    }

    Application {
        string id PK
        string positionId FK
        string applicantId FK
        string profileId FK
        string anonymousId
        string status
        int matchScore
        json rubricAudit
        json gapAnalysis
        boolean recruiterOverride
    }

    InterviewEvent {
        string id PK
        string applicationId FK
        string applicantId FK
        string recruiterId FK
        string status
        json proposedRanges
        datetime confirmedStart
        datetime confirmedEnd
        string meetingLink
    }

    AgentExecutionLog {
        string id PK
        string applicationId FK
        string agentType
        string modelUsed
        int promptTokens
        int outputTokens
        json structuredOutput
    }
```

The extended library sections (`skill`, `conference`, `creative`, `driving`, `hobby`, `honour`, `network`, `publication`, `recommendation`, `social`, `other`) share the generic `VaultEntry` table, indexed by `(userId, section)`.

---

## Information library

The **My Information** tab is a master library. Items are added once and reused across resumes. The panel uses a fixed viewport height with internal snap scrolling and a left-hand section navigator that highlights the active section.

| # | Section | Storage model | Attachable to a resume |
|---|---------|---------------|------------------------|
| 1 | Education and training | `VaultEducation` | Yes |
| 2 | Work experience | `VaultExperience` | Yes |
| 3 | Skills | `VaultEntry` | No (resume-level skills) |
| 4 | Language skills | `VaultLanguage` | Yes |
| 5 | Certifications | `VaultCertification` | Yes |
| 6 | Conferences and seminars | `VaultEntry` | No |
| 7 | Creative works | `VaultEntry` | No |
| 8 | Driving Licence | `VaultEntry` | No |
| 9 | Hobbies and interests | `VaultEntry` | No |
| 10 | Honours and awards | `VaultEntry` | No |
| 11 | Networks and memberships | `VaultEntry` | No |
| 12 | Projects | `VaultProject` | Yes |
| 13 | Publications | `VaultEntry` | No |
| 14 | Recommendations | `VaultEntry` | No |
| 15 | Social and political activities | `VaultEntry` | No |
| 16 | Volunteering | `VaultVolunteering` | Yes |
| 17 | Other (Custom section) | `VaultEntry` | No |
| 18 | Links & Portfolios | `VaultLink` | Yes |

The seven resume-attachable categories are `education`, `experience`, `project`, `certification`, `volunteering`, `language`, and `link`. Recruiters see exactly the sections a candidate selected when they preview an application resume.

---

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 19, Vite 6, React Router 7, TanStack Query 5, Zustand 5, Tailwind CSS 4, Axios, Lucide icons |
| Backend | Node.js, Express 4, TypeScript 5.7, Prisma 6, Zod 3, JWT, bcryptjs, Helmet, CORS, cookie-parser |
| Background jobs | BullMQ 5, ioredis, Redis |
| AI agents | Vercel AI SDK 7 (`ai`), `@ai-sdk/groq`, `@ai-sdk/openai`, Zod structured output |
| Database | PostgreSQL |
| Shared contracts | `packages/shared` with Zod schemas and API types |
| Tooling | npm, tsx, Prisma CLI, Vite |

---

## Project structure

```text
skillora/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Data model and enums
│   │   └── seed.ts                # Demo users, positions, resumes, applications
│   └── src/
│       ├── agents/                # Ingestion, matcher, growth, coordinator, orchestrator
│       │   ├── model.factory.ts   # Groq / Ollama model selection
│       │   ├── dossier.ts         # Anonymized dossier builder and prompt redaction
│       │   └── agent-log.ts       # AgentExecutionLog writer
│       ├── config/env.ts          # Validated environment configuration
│       ├── db/prisma.ts           # Prisma client singleton
│       ├── middleware/            # Auth guards and error handling
│       ├── modules/
│       │   ├── auth/              # Register, login, refresh, profile, password
│       │   ├── applicant/         # Resumes, applications, vault, interviews, insights
│       │   ├── recruiter/         # Positions, pipeline, overrides, slots, plans
│       │   └── public/            # Open position discovery
│       ├── queues/                # BullMQ queue config and evaluation worker
│       ├── app.ts                 # Express app and route mounting
│       └── server.ts              # Startup, database connection, worker bootstrap
├── frontend/
│   ├── index.html
│   └── src/
│       ├── api/                   # Axios client and TanStack Query client
│       ├── components/            # Navbar, error boundary, sketches
│       ├── data/                  # Plans, routes, Algeria reference data
│       ├── store/                 # Zustand auth and theme stores
│       └── views/
│           ├── guest/             # Landing, how it works, pricing, companies, about, jobs
│           ├── auth/              # Login and registration
│           ├── applicant/         # Dashboard, resume builder, information library, insights
│           ├── recruiter/         # Positions and application pipeline
│           └── settings/          # Profile and password settings
├── packages/shared/src/           # Shared Zod schemas and agent contracts
└── docs/assets/                   # README screenshots
```

---

## Getting started

### Prerequisites

- Node.js 20 or newer
- PostgreSQL 14 or newer
- Redis 6 or newer (recommended for queued evaluations; without it, evaluations run inline in the API process)

### 1. Clone the repository

```bash
git clone <repository-url> skillora
cd skillora
```

### 2. Start the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your database URL and two JWT secrets of at least 32 characters each. Then:

```bash
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

The API starts on `http://localhost:4000`. Health check: `GET http://localhost:4000/health`.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app starts on `http://localhost:5173` and proxies `/api` requests to the backend.

### 4. Sign in with a demo account

After seeding, all demo accounts use the password `password123`.

| Role | Email |
|------|-------|
| Recruiter | `recruiter@techcorp.dz` |
| Recruiter | `rh@banque-algerie.dz` |
| Applicant | `samy.benali@esi.dz` |
| Applicant | `amine.khelifi@gmail.com` |
| Applicant | `yasmine.meziane@avocat.dz` |
| Applicant | `lina.bensalem@design.dz` |

The seed also creates positions across tech, legal, finance, and operations, along with tailored resumes and applications.

---

## Environment variables

Backend variables are validated at startup in `backend/src/config/env.ts`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | API port |
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed CORS origin and cookie origin |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | — | Access token secret, minimum 32 characters |
| `JWT_REFRESH_SECRET` | Yes | — | Refresh token secret, minimum 32 characters |
| `REDIS_HOST` | No | `127.0.0.1` | Redis host for BullMQ |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | No | — | Redis password, if enabled |
| `LLM_PROVIDER` | No | `groq` | LLM provider: `groq` or `ollama` |
| `LLM_MODEL` | No | Provider default | Model ID override (Groq: `openai/gpt-oss-120b`; Ollama: `llama3.1:8b`) |
| `GROQ_API_KEY` | If `LLM_PROVIDER=groq` | — | Groq API key |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434/v1` | OpenAI-compatible Ollama endpoint |
| `OLLAMA_API_KEY` | No | `ollama` | Ollama API key placeholder, if required by your server |
| `LLM_TEMPERATURE` | No | `0.2` | Generation temperature, 0–2 |
| `LLM_MAX_RETRIES` | No | `2` | Retries per model call, 0–5 |

Example `.env`:

```dotenv
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DATABASE_URL=postgresql://skillora_user:skillora_pass@localhost:5432/skillora_db?schema=public

JWT_ACCESS_SECRET=replace_with_a_random_access_secret_at_least_32_chars
JWT_REFRESH_SECRET=replace_with_a_random_refresh_secret_at_least_32_chars

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# LLM adapter: use "groq" or "ollama"
LLM_PROVIDER=groq
LLM_MODEL=openai/gpt-oss-120b
GROQ_API_KEY=your_groq_api_key

# For local Ollama instead:
# LLM_PROVIDER=ollama
# LLM_MODEL=llama3.1:8b
# OLLAMA_BASE_URL=http://localhost:11434/v1
```

The frontend needs no environment file in development; Vite proxies `/api` to `http://localhost:4000`.

---

## Available scripts

### Backend (`backend/package.json`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the API and worker with `tsx watch` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server from `dist/server.js` |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:migrate` | Create and apply a development migration |
| `npm run prisma:seed` | Seed demo data |
| `npm run e2e:seed` | Create 6 recruiters, 3 five-minute jobs, 35 applicants, and 45 applications |
| `npm run e2e:test` | Seed the E2E dataset and verify it through the running API |
| `npm run db:clean` | Delete all users and dependent data after interactive confirmation |
| `npm run db:clean:yes` | Delete all users and dependent data without prompting |
| `npm run db:clean:dry` | Print database counts without deleting anything |
| `npm run applications:reevaluate` | Re-run evaluation for applications stuck in `SUBMITTED` or `EVALUATING` |
| `npm run applications:reevaluate:dry` | Preview applications that need re-evaluation |

#### E2E dataset

All generated accounts use the `.test` domain and password `password123`.

- **Recruiters:** `e2e.recruiter1@skillora.test` through `e2e.recruiter6@skillora.test`
- **Applicants:** `e2e.applicant01@skillora.test` through `e2e.applicant35@skillora.test`
- **Jobs:** 15 applications, 10 applications, and 20 applications respectively
- **Job deadline:** 5 minutes after creation (configurable with `--deadline-minutes=N`)

Because 45 applications are distributed across 35 applicants, applicants 16–25 each
apply to two positions. Seeded applications use completed evaluation statuses and
include notification messages, so none remain permanently `SUBMITTED`.
The backend must be running for `npm run e2e:test`.
Use `npm run e2e:seed -- --dry-run` to preview the dataset without writing.

If a real application is interrupted mid-evaluation and remains `SUBMITTED` or
`EVALUATING`, run `npm run applications:reevaluate` to process it through the
same agent pipeline and generate its notifications.

> `npm run db:clean` is destructive. It removes every user and all dependent
> positions, applications, resumes, vault entries, interviews, messages, and refresh tokens.

### Frontend (`frontend/package.json`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run preview` | Preview a production build |
| `npx vite build` | Create a production bundle in `dist/` |

> `npm run build` is defined as `tsc -b && vite build`, but no `tsconfig.json` is currently tracked in `frontend/`. Use `npx vite build` until a TypeScript project config is added.

---

## API reference

Base URL: `http://localhost:4000/api/v1`

All routes except registration and login require a bearer access token. Applicant routes require the `APPLICANT` role; recruiter routes require the `RECRUITER` role.

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create an applicant or recruiter account |
| `POST` | `/auth/login` | Sign in with email and password |
| `POST` | `/auth/refresh` | Rotate the access and refresh tokens using the refresh cookie |
| `POST` | `/auth/logout` | Revoke the refresh token and clear the cookie |
| `GET` | `/auth/me` | Get the current user |
| `PATCH` | `/auth/me` | Update profile details |
| `PATCH` | `/auth/me/password` | Change the account password |

### Applicant

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/applicant/profiles` | List tailored resumes |
| `POST` | `/applicant/profiles` | Create a tailored resume |
| `PUT` | `/applicant/profiles/:id` | Update a tailored resume |
| `DELETE` | `/applicant/profiles/:id` | Delete a tailored resume |
| `POST` | `/applicant/applications` | Apply to a position with a resume |
| `GET` | `/applicant/applications` | List the candidate's applications |
| `GET` | `/applicant/calendar` | List interview events and proposed slots |
| `POST` | `/applicant/interviews/select-range` | Confirm an interview slot |
| `GET` | `/applicant/messages` | List the notification inbox |
| `PATCH` | `/applicant/messages/:id/read` | Mark one notification as read |
| `POST` | `/applicant/messages/read-all` | Mark every notification as read |
| `GET` | `/applicant/insights` | Pro-only cross-round analytics |
| `POST` | `/applicant/upgrade-pro` | Activate a candidate pack (`months`: 1, 6, 12) |
| `GET` | `/applicant/vault` | Get the full information library |
| `GET` `POST` `DELETE` | `/applicant/vault/education` | Manage education entries |
| `GET` `POST` `DELETE` | `/applicant/vault/experience` | Manage work experience entries |
| `GET` `POST` `DELETE` | `/applicant/vault/projects` | Manage projects |
| `POST` `DELETE` | `/applicant/vault/certifications` | Manage certifications |
| `POST` `DELETE` | `/applicant/vault/volunteering` | Manage volunteering |
| `POST` `DELETE` | `/applicant/vault/languages` | Manage languages |
| `POST` `DELETE` | `/applicant/vault/links` | Manage links and portfolios |
| `POST` `DELETE` | `/applicant/vault/entries` | Manage generic library sections |

Delete routes use `/:id`, for example `DELETE /applicant/vault/entries/:id`.

### Recruiter

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/recruiter/positions` | Create a position with a rubric, interview capacity, and interview window |
| `GET` | `/recruiter/positions` | List the recruiter's positions |
| `GET` | `/recruiter/positions/:id` | Get a position and its slots |
| `PATCH` | `/recruiter/positions/:id/close` | Close a position |
| `GET` | `/recruiter/positions/:id/applications` | Ranked applicant pipeline |
| `GET` | `/recruiter/applications/:id/resume` | Full resume preview for an application |
| `POST` | `/recruiter/applications/:id/override` | Override a decision before the deadline |
| `POST` | `/recruiter/slots` | Configure an interview slot |
| `POST` | `/recruiter/upgrade` | Activate a company plan (`months`: 1, 12) |

### Public (authenticated discovery)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/public/positions` | List open positions with future deadlines |
| `GET` | `/public/positions/:id` | Get a single position |

---

## Pricing

Pricing is defined in `frontend/src/data/plans.ts` and surfaced on `/pricing`.

### Candidate packs

| Pack | Price | Effective monthly | Savings |
|------|-------|-------------------|---------|
| 1 month | 999 DZD | 999 DZD | — |
| 6 months | 2,999 DZD | 500 DZD | 50% |
| 12 months | 4,999 DZD | 417 DZD | 58% |

Candidate packs include:

- Unlimited active resumes across domains (tech, law, finance, operations)
- Unlimited monthly applications
- Personalized cross-round insights
- Priority scheduling agent routing

### Company plans

| Plan | Price | Effective monthly | Savings |
|------|-------|-------------------|---------|
| Monthly | 4,999 DZD | 4,999 DZD | — |
| Annual | 45,000 DZD | 3,750 DZD | 25% |

Company plans include:

- Pre-deadline manual decision override
- Autonomous document and repository parsing
- Autonomous calendar dispatch
- Automated respectful gap analysis

> **Test-mode activation.** No payment gateway is integrated yet. On `/pricing`, choosing a plan opens a confirmation modal that states no payment is collected and then calls the existing upgrade endpoint. The account tier and expiry update immediately, and choosing another plan while a plan is active extends the expiry from the current expiry date. Prices are shown for reference only.

Candidate packs activate `PRO`; company plans activate `ENTERPRISE`. The confirmation modal is the only gate before activation, so demo accounts can exercise paid features without a checkout flow.

---

## Frontend routes

| Path | Access | View |
|------|--------|------|
| `/` | Public | Landing page |
| `/how-it-works` | Public | Product walkthrough |
| `/pricing` | Public | Candidate packs and company plans |
| `/companies` | Public | Employer value proposition |
| `/about` | Public | About Skillora |
| `/auth` | Guests only | Login and registration |
| `/jobs` | Signed in | Open positions explorer |
| `/settings/profile` | Signed in | Profile and password settings |
| `/applicant/dashboard` | Applicant | Applications and interview logistics |
| `/applicant/profiles` | Applicant | Resume builder and information library |
| `/applicant/insights` | Applicant (Pro) | Cross-round analytics |
| `/recruiter/positions` | Recruiter | Position management |
| `/recruiter/positions/:id/applications` | Recruiter | Applicant pipeline and resume preview |
| `*` | Public | Not found |

---

## Design system

The UI uses a restrained editorial palette with CSS custom properties for instant light/dark switching:

- **Typography:** Darker Grotesque for display headings, Inter for body text, JetBrains Mono for labels and metadata.
- **Accent colors:** forest green for positive outcomes, amber for actionable feedback.
- **Surfaces:** `--bg-canvas`, `--bg-panel`, and `--border-line` tokens adapt across themes.
- **Motion:** page transitions and a circular reveal for theme changes, respecting `prefers-reduced-motion`.

---

## Current limitations

- **No payment gateway.** Upgrades are test-mode only: the pricing page asks for confirmation and then the existing endpoints activate tiers and expiry dates directly. No payment is collected.
- **LLM-dependent evaluation quality.** Ingestion, matching, growth, and coordination are LLM-first with deterministic fallbacks. Output quality depends on the configured model; the heuristic path is coarser but keeps the pipeline available when the provider is offline.
- **No automated test suite.** Validation is currently manual plus TypeScript checks.
- **Frontend TypeScript config.** The repo has no `frontend/tsconfig.json`, so use `npx vite build` for a production bundle.
- **No Docker setup.** PostgreSQL and Redis must be provided locally or externally.

---

## License

No license file is included in this repository. All rights are reserved unless a license is added.
