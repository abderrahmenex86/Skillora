# Large Seed Dataset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old E2E seed with one deterministic large seed: 2 admins, 8 recruiters (2 pending, 3 sharing one company), 100 applicants, 16 open jobs with deadlines from tomorrow to 30 days out, and 100 applications.

**Architecture:** Put all dataset definitions and planning helpers in `backend/scripts/seed-large-data.ts`, and keep Prisma writes, CLI flags, and verification in `backend/scripts/seed-large.ts`. This keeps the data easy to inspect and test without touching the database.

**Tech Stack:** TypeScript, tsx, Prisma, bcryptjs, Express API for optional verification.

**Spec:** `docs/superpowers/specs/2026-10-30-large-seed-design.md`

## Global Constraints

- Domain: `@skillora.test` for every seeded account.
- Password: `password123` for every seeded account.
- Admins: `admin@skillora.test`, `admin2@skillora.test`.
- Recruiters: `e2e.recruiter1@skillora.test` … `e2e.recruiter6@skillora.test`, `e2e.pending@skillora.test`, `e2e.pending2@skillora.test`.
- Applicants: `e2e.applicant01@skillora.test` … `e2e.applicant99@skillora.test`, then `e2e.applicant100@skillora.test`.
- Companies: 6 total; 4 `APPROVED`, 2 `PENDING`; Atlas Cloud has 3 recruiters.
- Jobs: 16 total; 7 Atlas Cloud, 3 each at Numidia Systems, Tell Platform, Sahara Fintech.
- Deadlines: day offsets `1, 3, 5, … 29, 30` from the seed run time.
- Applications: 100 total; 95 unique applicants with at least one; 5 applicants with none; 5 applicants with two; four jobs with 7 and twelve jobs with 6.
- Do not modify the Prisma schema or matcher behavior.
- Delete `backend/scripts/e2e-test-data.ts`; keep `backend/prisma/seed.ts`.
- Use the existing `notifyApplicationStatus` service so every application gets a message.

## Review Focus

- **Repeated seed runs:** a second run must delete the previous `@skillora.test` users and cascade their companies, jobs, applications, interviews, messages, and tokens.
- **Relative deadlines:** all 16 deadlines must be in the future for the run that created them, with the earliest tomorrow and the latest 30 days out.
- **Application coverage:** exactly 95 applicants must have at least one application, 5 must have none, and 5 must have two.
- **Shared company boundaries:** three recruiters share Atlas Cloud, but each recruiter sees only the positions they own; pending recruiters cannot read recruiter routes.
- **Evaluation artifacts:** scheduled applications have interview events; rejected applications have gap analysis with description gaps and an experience note.

---

### Task 1: Dataset Definitions and Plan Check

**Files:**
- Create: `backend/scripts/seed-large-data.ts`
- Test: `/tmp/opencode/seed-large-plan-check.ts`

**Interfaces:**
- Produces: `TEST_DOMAIN`, `TEST_PASSWORD`, `ADMIN_EMAILS`, `COMPANIES`, `RECRUITERS`, `POSITIONS`, `APPLICANTS`, `SEED_PLAN`.
- Produces: `deadlineOffsetFor(positionIndex: number): number`, `buildApplicationPlan(): ApplicationPlanEntry[]`, `statusForSlot(slotIndex: number, applicationCount: number): ApplicationStatus`.
- Produces types: `CompanySeed`, `BranchSeed`, `RecruiterSeed`, `PositionSeed`, `ApplicantSeed`, `ApplicationPlanEntry`.

- [ ] **Step 1: Write the failing plan check**

```ts
// /tmp/opencode/seed-large-plan-check.ts
import {
    APPLICANTS,
    COMPANIES,
    POSITIONS,
    RECRUITERS,
    buildApplicationPlan,
    deadlineOffsetFor,
    statusForSlot,
} from '/home/abderrahmene/portfolio/projects/skillora/backend/scripts/seed-large-data.ts';

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

assert(COMPANIES.length === 6, '6 companies');
assert(COMPANIES.filter((c) => c.status === 'APPROVED').length === 4, '4 approved');
assert(COMPANIES.filter((c) => c.status === 'PENDING').length === 2, '2 pending');
assert(RECRUITERS.length === 8, '8 recruiters');
assert(COMPANIES[0].recruiterIndexes.length === 3, 'Atlas Cloud has 3 recruiters');
assert(POSITIONS.length === 16, '16 positions');
assert(APPLICANTS.length === 100, '100 applicants');

const positionCounts = COMPANIES.map(
    (company) => POSITIONS.filter((p) => p.companyIndex === COMPANIES.indexOf(company)).length
);
assert(
    JSON.stringify(positionCounts) === JSON.stringify([7, 3, 3, 3, 0, 0]),
    `position distribution: ${positionCounts}`
);

const offsets = POSITIONS.map((_, index) => deadlineOffsetFor(index));
assert(
    JSON.stringify(offsets) ===
        JSON.stringify([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 30]),
    `deadline offsets: ${offsets}`
);

const plan = buildApplicationPlan();
assert(plan.length === 100, '100 applications');
const byPosition = new Map<number, number>();
const byApplicant = new Map<number, number>();
for (const entry of plan) {
    byPosition.set(entry.positionIndex, (byPosition.get(entry.positionIndex) ?? 0) + 1);
    byApplicant.set(entry.applicantIndex, (byApplicant.get(entry.applicantIndex) ?? 0) + 1);
}
assert([...byPosition.values()].filter((v) => v === 7).length === 4, '4 jobs with 7');
assert([...byPosition.values()].filter((v) => v === 6).length === 12, '12 jobs with 6');
assert(byApplicant.size === 95, '95 applicants applied');
assert([...byApplicant.values()].filter((v) => v === 2).length === 5, '5 applicants applied twice');
assert(APPLICANTS.length - byApplicant.size === 5, '5 applicants without applications');

assert(statusForSlot(0, 6) === 'INTERVIEW_SCHEDULED', 'first is scheduled');
assert(statusForSlot(1, 6) === 'NEEDS_REVIEW', 'second is needs review');
assert(statusForSlot(2, 6) === 'ON_HOLD', 'third is on hold');
assert(statusForSlot(3, 6) === 'REJECTED', 'fourth of six is rejected');
assert(statusForSlot(3, 7) === 'NEEDS_REVIEW', 'fourth of seven is needs review');

console.log('seed-large plan check ok');
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd backend && npx tsx /tmp/opencode/seed-large-plan-check.ts`
Expected: FAIL because `seed-large-data.ts` does not exist.

- [ ] **Step 3: Implement the dataset module**

Create `backend/scripts/seed-large-data.ts`. Use these exact accounts and companies:

| Company | Status | Recruiter indexes | Jobs |
|---------|--------|-------------------|------|
| Atlas Cloud | APPROVED | 0, 1, 2 | 7 |
| Numidia Systems | APPROVED | 3 | 3 |
| Tell Platform | APPROVED | 4 | 3 |
| Sahara Fintech | APPROVED | 5 | 3 |
| Cedar Mobility | PENDING | 6 | 0 |
| Aurassi Energy | PENDING | 7 | 0 |

Recruiter emails: recruiters 1–6 use `e2e.recruiter1@skillora.test` … `e2e.recruiter6@skillora.test`; recruiter 7 (pending) uses `e2e.pending@skillora.test`; recruiter 8 (pending) uses `e2e.pending2@skillora.test`.

Applicant emails: `e2e.applicant${String(index + 1).padStart(2, '0')}@skillora.test` for indexes `0..99`.

Position data:
- Atlas Cloud: 3 positions owned by recruiter 0, 2 by recruiter 1, 2 by recruiter 2.
- Numidia Systems: 3 positions owned by recruiter 3.
- Tell Platform: 3 positions owned by recruiter 4.
- Sahara Fintech: 3 positions owned by recruiter 5.
- Include the titles `Cloud Infrastructure Engineer`, `Backend Developer`, and `Platform Engineer` among the 16.
- Every position has a 40+ character description, a rubric with 2–4 mandatory criteria, 1–2 preferred criteria, and `minimumScoreThreshold: 70`.

`deadlineOffsetFor(index)` returns:

```ts
Math.min(30, 2 * index + 1);
```

`buildApplicationPlan()`:
- Assign applicants `0..94` round-robin to positions `0..15`.
- Add second applications for applicants `0..4` to positions `[1, 2, 3, 0, 15]`.
- Entry shape: `{ positionIndex, applicantIndex, slotIndex }`, where `slotIndex` is the zero-based index within that position.

`statusForSlot(slotIndex, applicationCount)`:
- 0 → `INTERVIEW_SCHEDULED`
- 1 → `NEEDS_REVIEW`
- 2 → `ON_HOLD`
- 3 when `applicationCount >= 7` → `NEEDS_REVIEW`
- everything else → `REJECTED`

`SEED_PLAN` exposes the counts used by the CLI summary.

- [ ] **Step 4: Run the plan check and confirm it passes**

Run: `cd backend && npx tsx /tmp/opencode/seed-large-plan-check.ts`
Expected: `seed-large plan check ok`

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/seed-large-data.ts
git commit -m "feat: define large seed dataset"
```

---

### Task 2: Seed Writers and Database Verification

**Files:**
- Create: `backend/scripts/seed-large.ts`
- Modify: `backend/package.json`
- Test: `/tmp/opencode/seed-large-db-check.ts`

**Interfaces:**
- Consumes: everything exported by `seed-large-data.ts`.
- Produces: `npm run seed:large`, `npm run seed:large -- --dry-run`, `npm run seed:large -- --verify`.
- Produces database rows matching the spec counts.

- [ ] **Step 1: Write the failing database check**

```ts
// /tmp/opencode/seed-large-db-check.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

async function main() {
    const domain = '@skillora.test';
    const [admins, recruiters, applicants, approved, pending, positions, applications] =
        await Promise.all([
            prisma.user.count({ where: { email: { endsWith: domain }, role: 'ADMIN' } }),
            prisma.user.count({ where: { email: { endsWith: domain }, role: 'RECRUITER' } }),
            prisma.user.count({ where: { email: { endsWith: domain }, role: 'APPLICANT' } }),
            prisma.company.count({ where: { status: 'APPROVED' } }),
            prisma.company.count({ where: { status: 'PENDING' } }),
            prisma.position.count(),
            prisma.application.count(),
        ]);

    assert(admins === 2, `2 admins, got ${admins}`);
    assert(recruiters === 8, `8 recruiters, got ${recruiters}`);
    assert(applicants === 100, `100 applicants, got ${applicants}`);
    assert(approved === 4, `4 approved companies, got ${approved}`);
    assert(pending === 2, `2 pending companies, got ${pending}`);
    assert(positions === 16, `16 positions, got ${positions}`);
    assert(applications === 100, `100 applications, got ${applications}`);

    const atlas = await prisma.company.findFirst({
        where: { name: 'Atlas Cloud' },
        include: { _count: { select: { members: true } } },
    });
    assert(atlas?._count.members === 3, 'Atlas Cloud has 3 members');

    const noApplications = await prisma.user.count({
        where: {
            email: { endsWith: domain },
            role: 'APPLICANT',
            applications: { none: {} },
        },
    });
    assert(noApplications === 5, `5 applicants without applications, got ${noApplications}`);

    const perApplicant = await prisma.application.groupBy({
        by: ['applicantId'],
        _count: { _all: true },
    });
    assert(
        perApplicant.filter((row) => row._count._all === 2).length === 5,
        '5 applicants with two applications'
    );

    const perPosition = await prisma.application.groupBy({
        by: ['positionId'],
        _count: { _all: true },
    });
    assert(
        perPosition.filter((row) => row._count._all === 7).length === 4,
        '4 positions with 7 applications'
    );
    assert(
        perPosition.filter((row) => row._count._all === 6).length === 12,
        '12 positions with 6 applications'
    );

    const scheduled = await prisma.application.count({
        where: { status: 'INTERVIEW_SCHEDULED' },
    });
    assert(scheduled === 16, `16 scheduled applications, got ${scheduled}`);
    const interviews = await prisma.interviewEvent.count();
    assert(interviews === 16, `16 interview events, got ${interviews}`);

    const rejected = await prisma.application.findMany({
        where: { status: 'REJECTED' },
        select: { gapAnalysis: true },
    });
    assert(
        rejected.every(
            (row) =>
                Array.isArray((row.gapAnalysis as { descriptionGaps?: unknown[] } | null)?.descriptionGaps) &&
                ((row.gapAnalysis as { descriptionGaps?: unknown[] }).descriptionGaps?.length ?? 0) > 0
        ),
        'every rejected application has description gaps'
    );

    const deadlines = await prisma.position.findMany({
        select: { deadline: true },
        orderBy: { deadline: 'asc' },
    });
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    assert(
        deadlines.every((row) => row.deadline.getTime() > now),
        'all deadlines are in the future'
    );
    assert(
        deadlines[0].deadline.getTime() - now < 2 * day,
        'earliest deadline is tomorrow'
    );
    assert(
        deadlines[15].deadline.getTime() - now > 29 * day,
        'latest deadline is about 30 days out'
    );

    console.log('seed-large database check ok');
    await prisma.$disconnect();
}

main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd backend && npx tsx /tmp/opencode/seed-large-db-check.ts`
Expected: FAIL because the current dataset has different counts.

- [ ] **Step 3: Implement `seed-large.ts`**

The script must:

1. Parse `--dry-run` and `--verify`.
2. Print the planned counts before any write.
3. In dry-run mode, return without deleting anything.
4. Delete all users whose email ends with `@skillora.test`.
5. Hash `password123` once.
6. Create the 2 admins.
7. Create the 8 recruiter users, then the 6 companies with departments and branches.
8. Set each recruiter’s `companyId` and `companyName`.
9. Create company events: `APPROVED` for approved companies, `SUBMITTED` for pending companies.
10. Create the 16 positions with their recruiter, company, department, branch, description, rubric, capacity, deadline, and interview window.
11. Create three recruiter slots per position.
12. Create the 100 applicant users and their vault entries and applicant profiles.
13. Create 100 applications from `buildApplicationPlan()`, with:
    - `anonymousId` `DZ-L${String(applicationNumber).padStart(4, '0')}`
    - statuses from `statusForSlot`
    - match scores and full audits
    - gap analysis for rejected applications
    - `appliedAt` spread over the previous 14 days
14. Create `InterviewEvent` rows for scheduled applications, using a slot two days after the position deadline.
15. Call `notifyApplicationStatus(application.id, status)` for every application.
16. Run `verifyDatabase()` and print the summary.
17. Parse `--verify` but do not implement API verification yet; Task 3 adds it.

Use these exact helpers for audit and gap JSON:

```ts
function auditFor(position: PositionSeed, status: ApplicationStatus, index: number) {
    const unmet =
        status === 'REJECTED' ? position.rubric.mandatoryCriteria.slice(-2)
        : status === 'NEEDS_REVIEW' ? position.rubric.mandatoryCriteria.slice(-1)
        : [];

    const mandatoryCriteriaAudit = position.rubric.mandatoryCriteria.map((criterion) => ({
        criterion,
        satisfied: !unmet.includes(criterion),
        evidenceFound: unmet.includes(criterion)
            ? null
            : `Verified qualification for ${criterion}`,
    }));

    const rubricScore = status === 'INTERVIEW_SCHEDULED' ? 92 : status === 'ON_HOLD' ? 84 : status === 'NEEDS_REVIEW' ? 68 : 48;
    const descriptionScore = status === 'INTERVIEW_SCHEDULED' ? 88 : status === 'ON_HOLD' ? 80 : status === 'NEEDS_REVIEW' ? 64 : 42;
    const targetYears = position.minimumYearsExperience;
    const provenYears = Math.max(0, targetYears - 1);
    const experienceScore = status === 'INTERVIEW_SCHEDULED' ? 90 : status === 'ON_HOLD' ? 85 : status === 'NEEDS_REVIEW' ? 65 : 55;
    const matchScore = Math.round(0.7 * rubricScore + 0.2 * descriptionScore + 0.1 * experienceScore);

    return {
        matchScore,
        rubricScore,
        category: status === 'INTERVIEW_SCHEDULED' ? 'ELIGIBLE' : status === 'REJECTED' ? 'REDIRECTED' : 'NEEDS_REVIEW',
        mandatoryCriteriaAudit,
        descriptionAudit: {
            score: descriptionScore,
            strengths: ['Portfolio evidence matches the core role responsibilities.'],
            gaps: unmet.map((criterion) => `No direct portfolio evidence for ${criterion}.`),
            rationale: 'Description alignment was scored against the seeded portfolio.',
        },
        experienceAudit: {
            targetYears,
            provenYears,
            score: experienceScore,
            rationale: `Proven ${provenYears} years against a preferred ${targetYears}-year target; this is a soft signal.`,
        },
        strengths: position.rubric.mandatoryCriteria.filter((c) => !unmet.includes(c)),
        unmetRequirements: unmet,
    };
}
```

For rejected applications, add `gapAnalysis` with `letter`, `verifiedStrengths`, `unmetMandatoryReasons`, `descriptionGaps`, `experienceNote`, and `recommendedBridgePath` (3–5 milestones).

- [ ] **Step 4: Add package scripts**

Modify `backend/package.json`:

```json
"seed:large": "tsx scripts/seed-large.ts",
"seed:large:verify": "tsx scripts/seed-large.ts --verify"
```

Keep all other scripts unchanged at this point.

- [ ] **Step 5: Run the dry-run**

Run: `cd backend && npm run seed:large -- --dry-run`
Expected: plan counts, no database changes.

- [ ] **Step 6: Run the seed twice**

Run: `cd backend && npm run seed:large && npm run seed:large`
Expected: both runs succeed with identical counts. The second run proves the `@skillora.test` cleanup cascades and does not accumulate duplicate companies, jobs, applicants, or applications.

- [ ] **Step 7: Run the database check**

Run: `cd backend && npx tsx /tmp/opencode/seed-large-db-check.ts`
Expected: `seed-large database check ok`

- [ ] **Step 8: Typecheck and commit**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

```bash
git add backend/scripts/seed-large.ts backend/scripts/seed-large-data.ts backend/package.json
git commit -m "feat: add large seed dataset"
```

---

### Task 3: API Verification, Old Seed Removal, and Documentation

**Files:**
- Modify: `backend/scripts/seed-large.ts`
- Modify: `backend/package.json`
- Delete: `backend/scripts/e2e-test-data.ts`
- Modify: `README.md`
- Test: `/tmp/opencode/seed-large-api-check.mjs`

**Interfaces:**
- Consumes: the seeded accounts and jobs from Task 2.
- Produces: `npm run seed:large:verify` and updated documentation.
- Removes: `npm run e2e:seed`, `npm run e2e:test`.

- [ ] **Step 1: Write the API verification check**

```js
// /tmp/opencode/seed-large-api-check.mjs
const API = 'http://localhost:4000/api/v1';

async function login(email) {
    const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(`login ${email}: ${response.status} ${JSON.stringify(body)}`);
    return body.accessToken;
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const admin = await login('admin@skillora.test');
const pending = await fetch(`${API}/admin/companies?status=PENDING`, {
    headers: { authorization: `Bearer ${admin}` },
}).then((response) => response.json());
assert(pending.companies.length === 2, 'admin sees 2 pending companies');

const recruiter = await login('e2e.recruiter1@skillora.test');
const positions = await fetch(`${API}/recruiter/positions`, {
    headers: { authorization: `Bearer ${recruiter}` },
}).then((response) => response.json());
assert(positions.positions.length === 3, 'recruiter1 owns 3 positions');

const pendingRecruiter = await login('e2e.pending@skillora.test');
const blocked = await fetch(`${API}/recruiter/positions`, {
    headers: { authorization: `Bearer ${pendingRecruiter}` },
});
assert(blocked.status === 403, 'pending recruiter is blocked');

const applicant = await login('e2e.applicant01@skillora.test');
const applications = await fetch(`${API}/applicant/applications`, {
    headers: { authorization: `Bearer ${applicant}` },
}).then((response) => response.json());
assert(applications.applications.length === 2, 'applicant01 has 2 applications');

const publicJobs = await fetch(`${API}/public/positions`).then((response) => response.json());
assert(publicJobs.positions.length === 16, '16 public jobs');

console.log('seed-large API check ok');
```

- [ ] **Step 2: Implement API verification in the seed**

Add a `verifyApi()` function in `seed-large.ts` that performs exactly the checks above and prints `API verification passed: admins, recruiters, applicants, and public jobs all match.`

Call it when `--verify` is present.

- [ ] **Step 3: Delete the old seed and update scripts**

```bash
rm backend/scripts/e2e-test-data.ts
```

Remove these lines from `backend/package.json`:

```json
"e2e:seed": "tsx scripts/e2e-test-data.ts",
"e2e:test": "tsx scripts/e2e-test-data.ts --verify"
```

Keep `seed:large` and `seed:large:verify`.

- [ ] **Step 4: Update README**

Replace the old E2E seed section with the new dataset:

- 2 admins: `admin@skillora.test`, `admin2@skillora.test`
- 8 recruiters: `e2e.recruiter1@skillora.test` … `e2e.recruiter6@skillora.test`, plus `e2e.pending@skillora.test` and `e2e.pending2@skillora.test`
- Pending recruiters: `e2e.pending@skillora.test`, `e2e.pending2@skillora.test`
- 100 applicants: `e2e.applicant01@skillora.test` … `e2e.applicant100@skillora.test`
- 6 companies, including Atlas Cloud with 3 recruiters
- 16 jobs with deadlines from tomorrow to 30 days out
- 100 applications, 95 applicants with at least one, 5 with none, 5 with two
- Commands: `npm run seed:large`, `npm run seed:large -- --dry-run`, `npm run seed:large:verify`
- Password: `password123`

Also remove README references to `e2e:seed` and `e2e:test`.

- [ ] **Step 5: Run the full seed verification**

Run:

```bash
cd backend
npm run seed:large
npm run seed:large:verify
npx tsx /tmp/opencode/seed-large-db-check.ts
node /tmp/opencode/seed-large-api-check.mjs
npx tsc --noEmit
```

Expected: all pass.

- [ ] **Step 6: Check for stale references**

Run:

```bash
cd /home/abderrahmene/portfolio/projects/skillora
rg "e2e:seed|e2e:test|e2e-test-data" README.md backend/package.json backend/scripts || true
```

Expected: no matches outside historical plan/spec documents. If `README.md` still matches, fix it.

- [ ] **Step 7: Commit**

```bash
git add backend/scripts/seed-large.ts backend/package.json README.md
git add -u backend/scripts/e2e-test-data.ts
git commit -m "feat: replace e2e seed with large dataset"
```
