# Company Onboarding, Admin Approval, and Job Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add company-level onboarding and admin approval, a dedicated job-creation page with company departments/branches and custom calendars, and description/experience scoring in the matcher.

**Architecture:** A first-class Company model owns approval status, departments, branches, and audit events. Recruiter accounts belong to a company; company status gates the recruiter workspace. Positions keep their creating recruiter as owner but gain company/department/branch relations, a required description, and a soft years target. The matcher continues to gate on mandatory rubric criteria and adds description/experience scores.

**Tech Stack:** React 19 + Vite + Tailwind, Express + Prisma/PostgreSQL, Zod, existing LLM/heuristic matcher, temporary Node/Playwright verification scripts.

**Spec:** `docs/superpowers/specs/2026-10-30-company-onboarding-admin-job-creation-design.md`

## Global Constraints

- Approval is **company-level**; the profile-first flow is **B**: signup → company profile → submit → admin review → approve → post.
- Company statuses: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `FROZEN`, `ARCHIVED`, `DELETED`.
- Frozen = login allowed, read-only; archived/deleted = login blocked; delete = **soft delete**, data retained.
- Positions remain **recruiter-owned**; company membership does not grant access to another recruiter’s pipeline in this iteration.
- Backfill creates **one company per recruiter**, not merged by name.
- Department/branch removal is **soft deactivate** (`isActive=false`); historical positions keep FKs/snapshots.
- Company/department/branch renames propagate to position snapshots.
- Job creation is a dedicated page at `/recruiter/positions/new`; company is read-only.
- Description is required and scored. Years of experience are **soft** and never a hard gate.
- Matcher weights: 70% rubric + 20% description + 10% experience when years are set; 70% rubric + 30% description when not.
- Keep the matcher’s existing `category` field/values; add `descriptionAudit` and `experienceAudit`.
- Native `datetime-local` cannot strike through disabled dates; use an in-repo calendar component.
- No new UI dependency and no committed test framework; verification uses temporary scripts.
- Preserve the existing S2, S3, public-job-share behavior, and `npm run e2e:test` data counts unless a task explicitly updates them.

## Review Focus

- A recruiter with a `DRAFT`, `PENDING`, `REJECTED`, `FROZEN`, `ARCHIVED`, or `DELETED` company must never bypass the correct gate; direct URL entry and API calls are both checked.
- An archived/deleted company must lose access even when the recruiter already has a valid access token or refresh cookie.
- Removing a department or branch must not break historical position pages or snapshots.
- Calendar edge cases: past dates, deadline/from/until dependencies, same-day time ordering, keyboard selection, and disabled dates rendering with a visible line-through.
- Matcher compatibility: old audits without description/experience still render; years cannot cause a hard rejection; a strong description/portfolio can compensate.

---

## File Structure

Backend:
- `backend/prisma/schema.prisma` — Company, CompanyDepartment, CompanyBranch, CompanyEvent, User/Position relations, enums.
- `backend/scripts/backfill-companies.ts` — legacy data migration with `--dry-run`.
- `backend/scripts/e2e-test-data.ts` — admin, companies, departments/branches, pending/rejected fixtures, positions with descriptions/years.
- `backend/src/modules/company/{company.service,company.schema,company.controller,company.routes}.ts` — recruiter company profile/onboarding.
- `backend/src/modules/admin/{admin.service,admin.schema,admin.controller,admin.routes}.ts` — admin review/actions.
- `backend/src/middleware/company.middleware.ts` — company status gates, frozen read-only.
- `backend/src/modules/auth/auth.service.ts` — signup company creation, login status checks, user payload.
- `backend/src/modules/recruiter/{recruiter.schema,recruiter.service,recruiter.controller}.ts` — new position contract.
- `backend/src/modules/public/{public.service,public.routes,share.routes}.ts` — approved-company visibility, description/years, share description.
- `backend/src/modules/applicant/applicant.service.ts` — reject applications to non-approved companies.
- `backend/src/agents/{matcher.agent,orchestrator,growth.agent}.ts` — description/experience scoring.
- `backend/src/app.ts` — mount company/admin routers.

Frontend:
- `frontend/src/views/recruiter/CompanyOnboardingView.tsx` — onboarding/status/settings.
- `frontend/src/views/recruiter/NewPositionView.tsx` — dedicated job page.
- `frontend/src/components/DateCalendar.tsx` — month grid + time field.
- `frontend/src/views/admin/AdminCompaniesView.tsx` — company list/filters.
- `frontend/src/views/admin/AdminCompanyDetailView.tsx` — profile, actions, audit history.
- `frontend/src/App.tsx` — routes/guards.
- `frontend/src/components/Navbar.tsx` — role/status-aware nav.
- `frontend/src/data/routes.ts` — role/company home resolver.
- `frontend/src/store/useAuthStore.ts` — company fields in the user type.
- `frontend/src/views/recruiter/RecruiterPositionsView.tsx` — remove modal, link to new page.
- `frontend/src/views/guest/JobsExplorerView.tsx` — description/years on public job.
- `frontend/src/views/recruiter/PositionApplicationsView.tsx` — description/experience audits.
- `frontend/src/views/applicant/ApplicantDashboardView.tsx` — feedback note.

---

## Task 1: Prisma Company Foundation

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Test: `/tmp/opencode/company-schema-check.ts`

**Interfaces:**
- Produces models: `Company`, `CompanyDepartment`, `CompanyBranch`, `CompanyEvent`.
- Produces enums: `CompanyStatus`, `CompanyEventType`.
- Produces User fields: `companyId`, `ownedCompanies`, `companyReviewEvents`.
- Produces Position fields: `companyId`, `departmentId`, `branchId`, `description`, `minimumYearsExperience`.

- [ ] **Step 1: Write the failing schema check**

```ts
// /tmp/opencode/company-schema-check.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const companies = await prisma.company.findMany();
console.log('company model ok', companies.length);
await prisma.$disconnect();
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd backend && npx tsx /tmp/opencode/company-schema-check.ts`
Expected: FAIL because `prisma.company` does not exist.

- [ ] **Step 3: Add the models and relations**

Add `CompanyStatus` and `CompanyEventType` enums; `Company`, `CompanyDepartment`, `CompanyBranch`, `CompanyEvent` models; `User.companyId`/`ownedCompanies`/`companyReviewEvents`; `Position.companyId`/`departmentId`/`branchId`/`description`/`minimumYearsExperience`; `Company.employeeCount Int?`, departments/branches `isActive Boolean @default(true)`, `Company.branches/departments/positions/events` relations. Use the exact names and statuses from the spec.

- [ ] **Step 4: Sync the schema and regenerate the client**

Run: `cd backend && npx prisma db push && npx prisma generate`
Expected: schema sync succeeds; Prisma Client generated.

- [ ] **Step 5: Run the schema check again**

Run: `cd backend && npx tsx /tmp/opencode/company-schema-check.ts`
Expected: PASS with `company model ok 0` (or existing count).

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat: add company data model"
```

---

## Task 2: Backfill and E2E Seed

**Files:**
- Create: `backend/scripts/backfill-companies.ts`
- Modify: `backend/scripts/e2e-test-data.ts`
- Test: `/tmp/opencode/seed-company-check.ts`

**Interfaces:**
- Produces one approved company per legacy recruiter, linked positions, departments/branches, legacy descriptions.
- Produces E2E: admin account, 3 approved companies with 6 recruiters, 1 pending company, 1 rejected company, 3 positions with descriptions/years.
- Consumes Task 1 models.

- [ ] **Step 1: Write the failing seed check**

```ts
// /tmp/opencode/seed-company-check.ts
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const [approved, pending, rejected, admin, positions] = await Promise.all([
  p.company.count({ where: { status: 'APPROVED' } }),
  p.company.count({ where: { status: 'PENDING' } }),
  p.company.count({ where: { status: 'REJECTED' } }),
  p.user.count({ where: { role: 'ADMIN' } }),
  p.position.count(),
]);
console.log({ approved, pending, rejected, admin, positions });
if (approved < 3 || pending < 1 || rejected < 1 || admin < 1 || positions !== 3) process.exit(1);
await p.$disconnect();
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd backend && npx tsx /tmp/opencode/seed-company-check.ts`
Expected: FAIL on the counts (no companies/admin yet).

- [ ] **Step 3: Implement the backfill script**

Create `backfill-companies.ts`:
- `--dry-run` prints the planned companies/links without writes.
- One company per recruiter: use `User.companyName`, else the first position’s `companyName`, else “Unassigned Company”.
- `employeeCount: 1`, status `APPROVED`; departments from position department strings; one branch from position location strings; link positions; legacy description; `PROFILE_UPDATED` event.
- Wrap writes in `prisma.$transaction`; abort on invalid data.

- [ ] **Step 4: Update the E2E seed**

- Add `admin@skillora.test` / `password123` with `Role.ADMIN`.
- Create approved companies: Atlas Cloud (recruiters 1/4), Numidia Systems (2/5), Tell Platform (3/6), with departments/branches matching the 3 positions.
- Create `Cedar Mobility` `PENDING` with `e2e.pending@skillora.test` and a complete profile.
- Create `Atlas Freight` `REJECTED` with `e2e.rejected@skillora.test`, reason stored.
- Link recruiters/positions; set position descriptions and `minimumYearsExperience` (e.g. 3/2/4); keep 45 applications and 3 active jobs.
- Add a `CompanyEvent` for the rejected fixture.
- Update `npm run e2e:test` expectations for 8 recruiters (6 approved + 1 pending + 1 rejected) while keeping 3 positions, 35 applicants, and 45 applications. The API verification should still check recruiter1/2/3 pipelines; pending/rejected recruiters must not appear in those pipeline checks.

- [ ] **Step 5: Seed and verify**

Run: `cd backend && npm run e2e:seed -- --deadline-minutes=120 && npx tsx /tmp/opencode/seed-company-check.ts && npm run e2e:test`
Expected: counts pass and API verification passes with 8 recruiters, 3 positions, 35 applicants, 45 applications.

- [ ] **Step 6: Commit**

```bash
git add backend/scripts/backfill-companies.ts backend/scripts/e2e-test-data.ts
git commit -m "feat: seed and backfill company data"
```

---

## Task 3: Company Onboarding API

**Files:**
- Create: `backend/src/modules/company/company.service.ts`
- Create: `backend/src/modules/company/company.schema.ts`
- Create: `backend/src/modules/company/company.controller.ts`
- Create: `backend/src/modules/company/company.routes.ts`
- Modify: `backend/src/app.ts`
- Test: `/tmp/opencode/company-onboarding-check.mjs`

**Interfaces:**
- `GET /api/v1/recruiter/company` → `{ company }` with departments/branches.
- `PATCH /api/v1/recruiter/company` → `{ name?, employeeCount?, industry?, website?, description? }`.
- `POST /api/v1/recruiter/company/departments` → `{ name }`.
- `PATCH /api/v1/recruiter/company/departments/:id` → `{ name?, isActive? }`.
- `POST /api/v1/recruiter/company/branches` → `{ label, wilaya, address?, isHeadquarters? }`.
- `PATCH /api/v1/recruiter/company/branches/:id` → `{ label?, wilaya?, address?, isHeadquarters?, isActive? }`.
- `POST /api/v1/recruiter/company/submit` → `{ company }`, status `PENDING`.
- Every mutation writes a `CompanyEvent`.
- Renaming the company/department/branch updates existing position snapshots in the same transaction; deactivating a department/branch does not alter historical position snapshots.

- [ ] **Step 1: Write the failing API check**

Use `fetch` with a pending/recruiter token:
- GET company returns `DRAFT` or `PENDING`.
- PATCH employee count/description.
- Add a department and branch.
- Rename the department and verify any linked position snapshot changes.
- Deactivate a department and verify it disappears from the active list but a linked position keeps its FK/snapshot.
- Submit; expect `PENDING` and one `SUBMITTED` event.
- Submit with zero active departments; expect 400.

- [ ] **Step 2: Run it and confirm it fails**

Run: `node /tmp/opencode/company-onboarding-check.mjs`
Expected: 404/401 because the routes do not exist.

- [ ] **Step 3: Implement service, schema, controller, routes**

Use `requireAuth` + `requireRole(Role.RECRUITER)`; load the recruiter’s company by `ownerId` or `companyId`. Allow profile edits in `DRAFT`, `REJECTED`, `APPROVED`; PENDING/FROZEN read-only. Validate employeeCount ≥1 on submit, at least one active department and branch. Write `CompanyEvent` types from the spec.

- [ ] **Step 4: Mount and rerun**

Mount at `/api/v1/recruiter/company`; run the check. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/company backend/src/app.ts
git commit -m "feat: add company onboarding API"
```

---

## Task 4: Auth Company Status and Recruiter Guards

**Files:**
- Modify: `backend/src/modules/auth/auth.service.ts`
- Create: `backend/src/middleware/company.middleware.ts`
- Modify: `backend/src/modules/recruiter/recruiter.routes.ts`
- Modify: `frontend/src/store/useAuthStore.ts` (type only; UI later)
- Test: `/tmp/opencode/company-auth-check.mjs`

**Interfaces:**
- `AuthUser` payload gains `companyId`, `companyStatus`, `companyName` in `register`, `login`, `refresh`, and `GET /auth/me`.
- `register` recruiter creates `Company` DRAFT and sets `companyId` in one transaction.
- `login`/`refresh` return 403 for `ARCHIVED`/`DELETED`; allow `DRAFT`, `PENDING`, `REJECTED`, `APPROVED`, `FROZEN`.
- `loadCompanyStatus` attaches `req.company = { id, status }`.
- `requireCompanyStatus(...statuses)` returns 403 on mismatch.
- `requireApprovedCompany` for position mutations; `requireRecruiterRead` allows APPROVED/FROZEN.

- [ ] **Step 1: Write the failing auth check**

- Register a unique recruiter; assert response `companyStatus === 'DRAFT'`.
- Login; access `/api/v1/recruiter/positions`; expect 403 (pending/draft).
- Set company `APPROVED` directly via Prisma; GET positions; expect 200.
- Set `FROZEN`; GET 200, POST position 403.
- Set `ARCHIVED`; login 403.
- Archive and assert refresh tokens for that recruiter are deleted.

- [ ] **Step 2: Run it and confirm it fails**

Run: `node /tmp/opencode/company-auth-check.mjs`
Expected: company fields missing / route access incorrect.

- [ ] **Step 3: Implement signup, status checks, and middleware**

Update auth register/login/refresh selects; create Company draft in the register transaction. Add company middleware and apply to recruiter routes. Add revocation on archive/delete (used by Task 5).

- [ ] **Step 4: Rerun and commit**

Run: `node /tmp/opencode/company-auth-check.mjs`
Expected: PASS.

```bash
git add backend/src/modules/auth/auth.service.ts backend/src/middleware/company.middleware.ts backend/src/modules/recruiter/recruiter.routes.ts frontend/src/store/useAuthStore.ts
git commit -m "feat: gate recruiter access by company status"
```

---

## Task 5: Admin Backend and Audit History

**Files:**
- Create: `backend/src/modules/admin/admin.service.ts`
- Create: `backend/src/modules/admin/admin.schema.ts`
- Create: `backend/src/modules/admin/admin.controller.ts`
- Create: `backend/src/modules/admin/admin.routes.ts`
- Modify: `backend/src/app.ts`
- Test: `/tmp/opencode/admin-company-check.mjs`

**Interfaces:**
- `GET /api/v1/admin/companies?status=&search=` → `{ companies }`.
- `GET /api/v1/admin/companies/:id` → `{ company }` with owner, departments, branches, positions, events.
- `POST /api/v1/admin/companies/:id/approve`
- `POST /api/v1/admin/companies/:id/reject` `{ reason }`
- `POST /api/v1/admin/companies/:id/freeze`
- `POST /api/v1/admin/companies/:id/unfreeze`
- `POST /api/v1/admin/companies/:id/archive`
- `POST /api/v1/admin/companies/:id/restore`
- `DELETE /api/v1/admin/companies/:id` `{ reason }` (soft delete)
- Every action writes a `CompanyEvent`; archive/delete revoke refresh tokens.

- [ ] **Step 1: Write the failing admin check**

Login as admin; list PENDING; approve the pending company; verify recruiter can access positions; freeze; verify GET allowed/POST blocked and public job hidden; verify an applicant with an existing interview still sees it in the applicant calendar; unfreeze; archive; verify login 403 and refresh tokens deleted; restore; delete; verify event history and soft retention.

- [ ] **Step 2: Run it and confirm it fails**

Run: `node /tmp/opencode/admin-company-check.mjs`
Expected: 404 for admin routes.

- [ ] **Step 3: Implement admin service/routes**

Use `requireAuth` + `requireRole(Role.ADMIN)`. Enforce the status transition table. Write events with actor/note. Delete refresh tokens for all company members on archive/delete. Set `reviewedAt`/`reviewedById` on approve/reject.

- [ ] **Step 4: Rerun and commit**

Run: `node /tmp/opencode/admin-company-check.mjs`
Expected: PASS.

```bash
git add backend/src/modules/admin backend/src/app.ts
git commit -m "feat: add admin company review API"
```

---

## Task 6: Position Contract and Public Visibility

**Files:**
- Modify: `backend/src/modules/recruiter/recruiter.schema.ts`
- Modify: `backend/src/modules/recruiter/recruiter.service.ts`
- Modify: `backend/src/modules/public/public.service.ts`
- Modify: `backend/src/modules/public/share.routes.ts`
- Modify: `backend/src/modules/applicant/applicant.service.ts`
- Test: `/tmp/opencode/position-company-check.mjs`

**Interfaces:**
- `CreatePositionSchema`: `title`, `departmentId` (uuid), `branchId` (uuid), `description` (min 40), `minimumYearsExperience?` (0–50), dates, capacity, rubric. No `companyName` from the client.
- `createPosition` derives `companyId`/`companyName`/`department`/`location` snapshots; validates approved company, department/branch ownership, dates, description.
- Public list/detail require `Company.status = APPROVED`; return `description`, `minimumYearsExperience`, branch/wilaya snapshots.
- Public share bridge `og:description` uses the job description (truncated).
- Applicant application submission rejects positions whose company is not APPROVED.

- [ ] **Step 1: Write the failing position check**

- Approved recruiter creates a position with company department/branch, description, years; assert 201, company name from company, snapshots correct.
- Another company’s department/branch is rejected 400/403.
- Pending/frozen recruiter cannot create.
- Public list/detail include description/years; frozen company position disappears; share bridge description includes it.
- Applicant application to frozen company is rejected.

- [ ] **Step 2: Run it and confirm it fails**

Run: `node /tmp/opencode/position-company-check.mjs`
Expected: schema rejects `departmentId` / positions not linked.

- [ ] **Step 3: Implement schema/service/public/application guards**

Update Zod, service validation, Prisma selects/relations, public filters, share description, and applicant company-status guard.

- [ ] **Step 4: Rerun and commit**

Run: `node /tmp/opencode/position-company-check.mjs`
Expected: PASS.

```bash
git add backend/src/modules/recruiter backend/src/modules/public backend/src/modules/applicant/applicant.service.ts
git commit -m "feat: scope positions to approved companies"
```

---

## Task 7: Recruiter Onboarding and Status UI

**Files:**
- Create: `frontend/src/views/recruiter/CompanyOnboardingView.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/data/routes.ts`
- Modify: `frontend/src/components/Navbar.tsx`
- Modify: `frontend/src/views/auth/AuthView.tsx`
- Modify: `frontend/src/store/useAuthStore.ts`
- Test: `/tmp/opencode/onboarding-ui-check.mjs`

**Interfaces:**
- Route `/recruiter/onboarding` renders profile sections and status (DRAFT/PENDING/REJECTED/APPROVED/FROZEN).
- Signup redirects recruiters to `/recruiter/onboarding`.
- Role/status home resolver: DRAFT/REJECTED → onboarding; PENDING → onboarding status; APPROVED/FROZEN → positions; ADMIN → admin companies.
- Recruiter nav reflects the status; frozen shows a read-only banner.

- [ ] **Step 1: Write the failing Playwright check**

Guest signup with a unique company; expect onboarding DRAFT; add department/branch and submit; expect PENDING status; pending recruiter cannot open `/recruiter/positions`; approve via admin API; reload; expect positions; rejected fixture shows reason and resubmit.
Approved company settings allow adding/renaming/deactivating departments and branches; deactivated rows disappear from job-creation dropdowns.

- [ ] **Step 2: Run it and confirm it fails**

Run: `node /tmp/opencode/onboarding-ui-check.mjs`
Expected: no onboarding route / redirect.

- [ ] **Step 3: Implement the page, guards, navigation, and redirect**

Use the company API; sections for company info, departments, branches, review/submit; read-only states; banner; error handling. The app-level `/auth/me` refresh must update `companyStatus` so an approval is reflected without a re-login.

- [ ] **Step 4: Rerun and commit**

Run: `node /tmp/opencode/onboarding-ui-check.mjs`
Expected: PASS.

```bash
git add frontend/src/views/recruiter/CompanyOnboardingView.tsx frontend/src/App.tsx frontend/src/data/routes.ts frontend/src/components/Navbar.tsx frontend/src/views/auth/AuthView.tsx frontend/src/store/useAuthStore.ts
git commit -m "feat: add recruiter company onboarding UI"
```

---

## Task 8: Admin Dashboard UI

**Files:**
- Create: `frontend/src/views/admin/AdminCompaniesView.tsx`
- Create: `frontend/src/views/admin/AdminCompanyDetailView.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Navbar.tsx`
- Test: `/tmp/opencode/admin-ui-check.mjs`

**Interfaces:**
- `/admin/companies` list with status tabs/search/counts.
- `/admin/companies/:id` detail with profile, owner, departments, branches, positions, events.
- Actions call Task 5 endpoints; reason/confirmation modals; admin-only guard/nav.

- [ ] **Step 1: Write the failing Playwright check**

Admin login; see PENDING company; open detail; approve; see it under APPROVED; freeze; open recruiter workspace read-only; archive; delete; event history visible.

- [ ] **Step 2: Run it and confirm it fails**

Run: `node /tmp/opencode/admin-ui-check.mjs`
Expected: no admin route.

- [ ] **Step 3: Implement the dashboard and guard/nav**

Use the design system; responsive list/detail; action buttons disabled by status; confirmation/reason inputs; event timeline.

- [ ] **Step 4: Rerun and commit**

Run: `node /tmp/opencode/admin-ui-check.mjs`
Expected: PASS.

```bash
git add frontend/src/views/admin frontend/src/App.tsx frontend/src/components/Navbar.tsx
git commit -m "feat: add admin company dashboard"
```

---

## Task 9: Custom Calendar and Dedicated Job Page

**Files:**
- Create: `frontend/src/components/DateCalendar.tsx`
- Create: `frontend/src/views/recruiter/NewPositionView.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/views/recruiter/RecruiterPositionsView.tsx`
- Test: `/tmp/opencode/job-page-check.mjs`

**Interfaces:**
- `DateCalendar` props: `{ value, onChange, min?, max?, disabledDate?, label, id }`.
- `TimeField` props: `{ value, onChange, label, id }`.
- Route `/recruiter/positions/new`.
- Company read-only; department/branch dropdowns; title; description; years; rubric; capacity; three calendar/time pairs.
- Positions list links to the page; modal removed.

- [ ] **Step 1: Write the failing Playwright check**

Approved recruiter opens the page; company is read-only; department/branch options match the company; description required; years optional; calendar renders disabled dates with `text-decoration-line: line-through` and `aria-disabled`; keyboard focus/Enter selects an enabled date; from-date cannot precede deadline; until-date cannot precede from; submit creates a position visible in the list.

- [ ] **Step 2: Run it and confirm it fails**

Run: `node /tmp/opencode/job-page-check.mjs`
Expected: route/modal still present.

- [ ] **Step 3: Implement the calendar and page**

Build the month grid with keyboard support, disabled styling, min/max, and time fields. Build the page sections and validation; wire the create endpoint; remove the modal.

- [ ] **Step 4: Rerun and commit**

Run: `node /tmp/opencode/job-page-check.mjs`
Expected: PASS.

```bash
git add frontend/src/components/DateCalendar.tsx frontend/src/views/recruiter/NewPositionView.tsx frontend/src/App.tsx frontend/src/views/recruiter/RecruiterPositionsView.tsx
git commit -m "feat: add dedicated job creation page"
```

---

## Task 10: Public Job Description and Soft Years

**Files:**
- Modify: `frontend/src/views/guest/JobsExplorerView.tsx`
- Modify: `frontend/src/views/guest/JobsExplorerView.tsx` share description
- Test: `/tmp/opencode/public-job-check.mjs`

**Interfaces:**
- Public detail shows the job description, branch label/wilaya, department, and “Preferred proven experience” (not required).
- Share bridge `og:description` uses the description; frozen/archived companies remain hidden.
- Closed-position state remains intact.

- [ ] **Step 1: Write the failing public check**

Guest opens an approved active job; sees description and preferred years; share bridge description includes the job description; frozen company job is absent and direct link shows unavailable.

- [ ] **Step 2: Run it and confirm it fails**

Run: `node /tmp/opencode/public-job-check.mjs`
Expected: description/years absent.

- [ ] **Step 3: Implement the public display and share text**

Use the public payload fields; keep the existing share row; truncate descriptions for OG safely.

- [ ] **Step 4: Rerun and commit**

Run: `node /tmp/opencode/public-job-check.mjs`
Expected: PASS.

```bash
git add frontend/src/views/guest/JobsExplorerView.tsx
git commit -m "feat: show job descriptions and soft experience"
```

---

## Task 11: Matcher Description/Experience Scoring

**Files:**
- Modify: `backend/src/agents/matcher.agent.ts`
- Modify: `backend/src/agents/orchestrator.ts`
- Modify: `backend/src/agents/growth.agent.ts`
- Modify: `frontend/src/views/recruiter/PositionApplicationsView.tsx`
- Modify: `frontend/src/views/applicant/ApplicantDashboardView.tsx`
- Test: `/tmp/opencode/matcher-check.mjs`

**Interfaces:**
- `matcherAgent.run(applicationId, telemetry, context, dossier)` where context is `{ rubric, description, minimumYearsExperience }`.
- Output adds `rubricScore`, `descriptionAudit { score, strengths, gaps, rationale }`, `experienceAudit { targetYears, provenYears, score, rationale }`; keeps `matchScore`, `category`, `mandatoryCriteriaAudit`, `strengths`, `unmetRequirements`.
- Combined score: 70/20/10 with years; 70/30 without. Mandatory criteria gate; years never gate.
- Orchestrator passes position description/years; growth feedback includes description/experience notes.
- Recruiter pipeline shows audits; old audits show “Not evaluated.”

- [ ] **Step 1: Write the failing matcher check**

Import/export the heuristic function; run a fixture where all mandatory criteria pass, description is strong, proven years are below target; assert `descriptionAudit`/`experienceAudit` exist, combined score is not zero, `category !== 'REDIRECTED'` solely for years. Run a mandatory-failure fixture and assert `REDIRECTED`.

- [ ] **Step 2: Run it and confirm it fails**

Run: `node /tmp/opencode/matcher-check.mjs`
Expected: missing fields/signature.

- [ ] **Step 3: Implement schema, prompt, heuristic, orchestrator, and UI**

Add the additive fields; keep `category`; pass context; compute weights; update growth feedback; render audits with neutral fallback.

- [ ] **Step 4: Rerun and commit**

Run: `node /tmp/opencode/matcher-check.mjs`
Expected: PASS.

```bash
git add backend/src/agents frontend/src/views/recruiter/PositionApplicationsView.tsx frontend/src/views/applicant/ApplicantDashboardView.tsx
git commit -m "feat: score job descriptions and soft experience"
```

---

## Task 12: Backfill Run, Documentation, and Regression

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-10-30-company-onboarding-admin-job-creation-design.md` if implementation diverges
- Test: existing temporary suites

- [ ] **Step 1: Run the backfill dry-run**

Run: `cd backend && npx tsx scripts/backfill-companies.ts --dry-run`
Expected: summary of companies/positions with no writes.

- [ ] **Step 2: Re-seed and run the full regression set**

Run:
```bash
cd backend && npm run e2e:seed -- --deadline-minutes=120
npm run e2e:test
cd ..
# These three are the prior audit scripts. If they are absent in the execution
# environment, recreate them from the audit run or record the gap explicitly.
node --test /tmp/opencode/share-checks.mjs
node --test /tmp/opencode/s2-checks.mjs
node --test /tmp/opencode/s3-checks.mjs
node /tmp/opencode/company-auth-check.mjs
node /tmp/opencode/admin-company-check.mjs
node /tmp/opencode/job-page-check.mjs
node /tmp/opencode/public-job-check.mjs
node /tmp/opencode/matcher-check.mjs
```
Expected: all pass.

- [ ] **Step 3: Typecheck and build**

Run:
```bash
cd backend && npx tsc --noEmit
cd ../frontend && npx tsc --noEmit --jsx react-jsx --module ESNext --moduleResolution Bundler --target ES2022 --skipLibCheck --esModuleInterop --lib DOM,DOM.Iterable,ES2022 --types vite/client src/App.tsx
npx vite build
```
Expected: no errors; build succeeds.

- [ ] **Step 4: Update README**

Document company onboarding, admin account, new routes, job creation page, calendars, description/years scoring, and the backfill command.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/superpowers/specs/2026-10-30-company-onboarding-admin-job-creation-design.md
git commit -m "docs: document company onboarding and job creation"
```
