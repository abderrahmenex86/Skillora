# Company onboarding, admin approval, and evidence-rich job creation — design

**Date:** 2026-10-30
**Status:** proposed
**Scope:** company accounts, recruiter onboarding, admin review lifecycle, dedicated job creation, custom date calendars, job descriptions, soft experience scoring, and the matcher changes required by those inputs.

## Intent

A recruiter should not be able to publish jobs until their company has been reviewed and approved. Company data — size, departments, and branches — becomes the source of truth for job creation, so a recruiter cannot type an arbitrary company, department, or location into every post. Jobs gain a mandatory description and a soft years-of-experience target, both of which the matcher evaluates alongside the evidence rubric.

A master admin account reviews company profiles, approves or rejects them, and can freeze, archive, restore, or soft-delete them.

## Goals

1. Add a first-class Company entity with size, industry, description, departments, branches, and lifecycle status.
2. Make recruiter signup create a company draft; the recruiter completes the profile and submits it for review.
3. Add a dedicated admin dashboard for approve/reject/freeze/unfreeze/archive/restore/soft-delete.
4. Replace the job-creation modal with a full page at `/recruiter/positions/new`.
5. Fix company to the recruiter’s approved company; department and location become dropdowns sourced from company departments and branches.
6. Add a custom month-grid calendar for the three date fields, with disabled dates visibly struck through.
7. Make job description mandatory and evaluate candidates against it as a scored dimension.
8. Add a soft years-of-experience target; it influences the score but never hard-rejects a candidate with a strong portfolio.
9. Keep all existing applicant, public-jobs, sharing, and UX-audit behavior working.
10. Backfill existing users/positions and update the E2E seed.

## Non-goals

- Inviting or joining an existing company. The schema supports multiple recruiter members per company, but this iteration creates the company owner at signup. A join/invite flow is a follow-up.
- Hard years-of-experience gating. The user explicitly chose a soft signal.
- A new calendar dependency. The calendar is a small in-repo component.
- Admin analytics, billing controls, or company verification documents.
- Email notifications for approval decisions. Status is shown in-app; email can be added later.
- Full multi-tenant company branding or logo uploads. Company fields are text; a logo URL can be added later.

## Constraints

- Prisma/PostgreSQL; the repo has no migration folder. Schema changes need a migration or `prisma db push` plus a one-off backfill script for existing data.
- Existing recruiters and positions use free-text `companyName`, `department`, and `location`. They must be migrated into companies, departments, branches, and position relations.
- Existing E2E data, the S2/S3 UX checks, and the public job sharing checks must keep passing.
- The app has no automated test framework; verification uses temporary backend/Playwright checks, TypeScript, and the Vite build, as in prior iterations.
- The LLM matcher is primary; the heuristic fallback must still produce a usable result when no model is available.
- The custom calendar must be keyboard accessible and respect reduced motion.

## Approaches considered

### Company model

- **Separate Company / CompanyDepartment / CompanyBranch entities (chosen).** Departments and branches become relational dropdown sources; the company carries lifecycle status and review metadata.
- JSON blobs on `User` (rejected): simpler schema, but no referential integrity for job creation, no clean admin review, and no multi-recruiter support.

### Approval timing

- **Profile-first review (chosen, option B).** Recruiter signs up, completes the company profile, submits, then admin reviews the full profile. This gives the admin real information to approve.
- Approve-at-signup then complete profile (rejected): faster, but the admin reviews only a name and the company can submit incomplete data.

### Admin surface

- **Dedicated `/admin` dashboard (chosen).** Company list by status, detail view, review actions, reasons.
- Actions embedded in the recruiter positions page (rejected): mixes roles and exposes admin controls in the recruiter workspace.

### Job creation

- **Dedicated page (chosen, requested).** Full-width form with company context, departments, branches, description, rubric, and calendars.
- Modal (current; rejected): too cramped for the new fields and calendars.

### Description and experience

- **Scored description and soft experience (chosen).** The description is a first-class scored dimension; years influence the score but do not gate eligibility. Mandatory rubric criteria remain the only hard evidence gate.
- Description as a hard gate (rejected): over-rejects strong portfolios and conflicts with the user’s preference.
- Years as a hard minimum (rejected explicitly by the user).

### Calendar

- **In-repo month grid with disabled dates struck through (chosen).** Meets the visual requirement without adding a dependency.
- Native `datetime-local` (rejected): cannot style disabled dates with strikethrough.
- Third-party calendar (rejected for this iteration): unnecessary dependency for three fields.

## Data model

### Company

```text
Company
  id            String   @id @default(uuid())
  name          String
  employeeCount Int?       // required by the time the company is submitted
  industry      String?
  website       String?
  description   String?
  status        CompanyStatus @default(DRAFT)
  rejectionReason String?
  submittedAt   DateTime?
  reviewedAt    DateTime?
  reviewedById  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  ownerId       String
  owner         User @relation("CompanyOwner", fields: [ownerId], references: [id])
  members       User[] @relation("CompanyMembers")
  departments   CompanyDepartment[]
  branches      CompanyBranch[]
  positions     Position[]
  events        CompanyEvent[]
```

`CompanyStatus`: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `FROZEN`, `ARCHIVED`, `DELETED`.

### CompanyDepartment

```text
CompanyDepartment
  id        String @id @default(uuid())
  companyId String
  name      String
  isActive  Boolean @default(true)
  createdAt DateTime @default(now())
  company   Company @relation(...)
  positions Position[]
  @@unique([companyId, name])
```

### CompanyBranch

```text
CompanyBranch
  id            String @id @default(uuid())
  companyId     String
  label         String   // e.g. "Head Office", "M'Sila Plant"
  wilaya        String
  address       String?
  isHeadquarters Boolean @default(false)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  company       Company @relation(...)
  positions     Position[]
  @@unique([companyId, label])
```

### CompanyEvent (audit trail)

```text
CompanyEvent
  id        String @id @default(uuid())
  companyId String
  adminId   String? // null for recruiter profile submissions/edits
  type      CompanyEventType
  note      String?
  createdAt DateTime @default(now())
  company   Company @relation(...)
  admin     User? @relation("CompanyReviewEvents", fields: [adminId], references: [id])
```

`CompanyEventType`: `SUBMITTED`, `APPROVED`, `REJECTED`, `FROZEN`, `UNFROZEN`, `ARCHIVED`, `RESTORED`, `DELETED`, `PROFILE_UPDATED`, `DEPARTMENTS_UPDATED`, `BRANCHES_UPDATED`.

This makes “logged” a persistent, admin-visible history rather than a console line. The admin detail page shows the event history; `reviewedAt`/`reviewedById` remain the latest review fields.


### User changes

- Add `companyId String?` and `company Company? @relation("CompanyMembers", fields: [companyId], references: [id])`.
- Add `ownedCompanies Company[] @relation("CompanyOwner")` and `companyReviewEvents CompanyEvent[] @relation("CompanyReviewEvents")`.
- Keep `companyName` for the existing signup payload and as a legacy snapshot; new recruiter accounts create a Company and set `companyId`. The onboarding flow uses the Company name, not the free-text field.
- Recruiter access is derived from the company status; no separate recruiter approval flag.
- **Access boundary:** positions remain owned by the creating recruiter (`Position.recruiterId`). Company membership does not grant one recruiter access to another recruiter’s pipelines in this iteration. Company status gates whether any of its recruiters can publish/manage; the admin sees all company positions. This keeps existing recruiter-scoped queries intact while the company owns onboarding and review.
- `Role.ADMIN` remains; an admin has no company.

### Position changes

- Add `companyId`, `departmentId`, `branchId` relations.
- Add `description String` (required for new positions).
- Add `minimumYearsExperience Int?` (soft target).
- Keep `companyName`, `department`, `location` as denormalized snapshots for existing public/share payloads and legacy rows. New positions fill them from the company/department/branch at creation time.
- **Location snapshot format:** `${branch.label} · ${branch.wilaya}` (for example, “M’Sila Plant · M’Sila”). The onboarding helper asks for a branch label that is not just the city name.
- **Snapshot propagation:** renaming the company, a department, or a branch label/wilaya updates the corresponding snapshots on that company’s positions in the same transaction. Removing a department/branch does **not** alter historical position snapshots; the relation remains for history and new positions stop offering it.
- Existing positions are backfilled **one company per recruiter**, not grouped by name:
  - Use the recruiter’s `companyName`; if empty, use the first position’s `companyName`; if both are empty, “Unassigned Company”.
  - Create the company as `APPROVED` with `employeeCount` 1 so existing recruiters keep working.
  - Create a department from each position’s department and a branch from its location; link positions.
  - Set `description` to a legacy fallback such as “Requirements are defined by the mandatory rubric for this role.” and `minimumYearsExperience` null.
  - Do not merge same-name recruiters during backfill; a merge/invite flow is out of scope. This avoids accidentally granting one recruiter access to another’s pipelines.
- The public API continues to return company name/department/location snapshots plus the new description and soft years field.

## Lifecycle and access rules

### Company status machine

```text
DRAFT --submit--> PENDING --approve--> APPROVED
PENDING --reject(reason)--> REJECTED --edit/resubmit--> PENDING
APPROVED --freeze--> FROZEN --unfreeze--> APPROVED
APPROVED/FROZEN --archive--> ARCHIVED --restore--> APPROVED
ANY --delete--> DELETED
```

### Recruiter access by company status

| Company status | Login | Workspace |
|---|---|---|
| DRAFT | Yes | `/recruiter/onboarding` only |
| PENDING | Yes | Review-status page only |
| REJECTED | Yes | Onboarding with rejection reason; edit/resubmit |
| APPROVED | Yes | Full recruiter workspace and job creation |
| FROZEN | Yes | Read-only positions/data; no create/edit/pipeline actions; banner explains the freeze |
| ARCHIVED | No | Login returns an “account archived” message |
| DELETED | No | Login returns a generic unavailable message |

- **Visibility is derived from `Company.status`, not by mutating `Position.status`.** This makes restore predictable: approved companies become visible again without remembering prior statuses.
  - Freeze hides the company’s jobs from public discovery and the share bridge; existing interviews remain visible to applicants. Recruiters can view data read-only.
  - Archive hides jobs and blocks login; restoring returns the company to `APPROVED` and visibility follows. Positions keep their own `OPEN`/`CLOSED` status.
  - Soft delete hides everything and blocks login; all rows are retained for audit.
  - Public list/share queries join the company and require `Company.status = APPROVED`.
  - Direct `/jobs/:id` links for frozen/archived/deleted companies show a closed/unavailable state, not a live apply flow.
  - `POST /applicant/applications` rejects a position whose company is not `APPROVED`.
  - Existing applicant interviews/applications remain visible through applicant endpoints even if the company is frozen/archived; no new applications are accepted.
- **Department and branch removal is soft.** Add `isActive` to both; removing sets `isActive=false`. Job-creation dropdowns filter active rows. Existing positions keep the FK and snapshot for history. If a row has no positions, a hard delete is allowed only as an admin-only cleanup; the default recruiter action is deactivate.
- **Post-approval edits:** departments and branches can be added/edited/deactivated; company profile fields can be edited. Edits do not reset approval. Name/department/branch renames propagate to position snapshots. Every edit writes a `CompanyEvent`.
- **Session enforcement:** archive and soft delete also delete the company members’ refresh tokens. Recruiter API routes use a company-status middleware: `ARCHIVED`/`DELETED` return 403 for all recruiter calls; `FROZEN` allows GETs but blocks mutations. The frontend handles the 403 by showing the archived/frozen status and clearing the session for archived/deleted. Access tokens expire in 15 minutes, so the middleware is what makes the block immediate.
- Frozen recruiters see a persistent banner and disabled action buttons; backend routes also enforce read-only.

## Recruiter signup and onboarding

1. **Signup** asks for name, email, password, and company name. It creates:
   - a `User` with role `RECRUITER` and `companyId`
   - a `Company` in `DRAFT` with `ownerId`
   - the recruiter is redirected to `/recruiter/onboarding`.
2. **Onboarding** (`/recruiter/onboarding`) is a single page with sections:
   - **Company profile:** display name, employee count, industry, website, company description.
   - **Departments:** add/remove at least one department name.
   - **Branches:** add/remove at least one branch; each with label, wilaya (from `ALGERIA_WILAYAS`), address, headquarters flag.
   - **Review & submit:** summary and “Submit for review”.
   - Save as draft is allowed; submitting sets status `PENDING` and `submittedAt`.
3. **Pending status page** (`/recruiter/onboarding` or a dedicated `/recruiter/status`) shows “Under review”, submitted date, and a link to edit while pending? Editing while pending should be disabled or resubmit after rejection. Decision: editing is allowed only in DRAFT/REJECTED. PENDING is read-only.
4. **Rejected** shows the admin reason and allows edits/resubmit (status returns to PENDING).
5. **Approved** redirects to `/recruiter/positions`; the onboarding page becomes a company settings page (post-approval edits allowed).
6. **Frozen** shows the workspace read-only with a banner; no onboarding changes? Allow read-only company view.

### Company onboarding fields

- Company name (default from signup), employee count (integer, min 1; nullable in `DRAFT`, required on submit), industry (optional), website (optional), description (optional but recommended).
- Departments: at least one active; name max 100 chars; unique per company.
- Branches: at least one active; label max 100, wilaya required, address optional, exactly one headquarters flag (first branch defaults to HQ; allow changing).
- Extra fields can be added later; keep the form focused.

## Admin dashboard

### Routes and roles

- `/admin` → redirect to `/admin/companies`.
- `/admin/companies` → list with status tabs/filters and search.
- `/admin/companies/:id` → company detail, recruiters, departments, branches, positions, review metadata, actions.
- `Role.ADMIN` route guard; admin login redirects to `/admin/companies`.
- Seed a master admin, e.g. `admin@skillora.test` / `password123` (documented in the E2E seed and README).
- Admin nav: Companies, maybe a small count of pending reviews. No upgrade/theme-only nav clutter.

### Actions

| Action | Allowed from | Result |
|---|---|---|
| Approve | PENDING | APPROVED, reviewedAt/reviewedById |
| Reject | PENDING | REJECTED + reason; recruiter can edit/resubmit |
| Freeze | APPROVED | FROZEN; read-only workspace; public jobs hidden |
| Unfreeze | FROZEN | APPROVED |
| Archive | APPROVED, FROZEN | ARCHIVED; login blocked; jobs closed/hidden |
| Restore | ARCHIVED | APPROVED |
| Delete | any | DELETED (soft); login blocked; hidden from default lists; data retained |

- Reject/delete require a reason or confirmation.
- Admin list defaults to PENDING first, then APPROVED/FROZEN; filters for REJECTED/ARCHIVED/DELETED.
- The detail view shows company profile, owner recruiter, departments, branches, positions with counts, and the `CompanyEvent` audit history.
- Every lifecycle action writes a `CompanyEvent` with actor, type, note, and timestamp. Rejection reasons and deletion confirmations are stored in the event note.
- Admin actions create no applicant-facing message in this iteration; status is visible to the recruiter. (Email later.)

## Dedicated job creation page

### Route and layout

- `/recruiter/positions/new` (new page) and `/recruiter/positions/:id/edit` only if editing is in scope. This iteration creates only; editing an existing position is out of scope unless requested.
- The positions list gets a “New Position” link/button to the page; remove the modal and its local form state.
- Page sections:
  1. **Company context:** read-only company name, department dropdown, branch dropdown. A link to company settings.
  2. **Role:** job title, mandatory job description (textarea), soft years-of-experience target (number, optional), maybe “level” label derived from years.
  3. **Evidence rubric:** mandatory criteria (chip/textarea), preferred criteria (optional), minimum score threshold (default 70).
  4. **Timeline and capacity:** application close, interviews from, interviews until (custom calendars), interview capacity.
  5. **Review and publish.** Server validation; success returns to positions.

### Backend contract

- `CreatePositionSchema`:
  - `departmentId`, `branchId` UUIDs
  - `title`, `description` (min length, e.g. 40 chars), `minimumYearsExperience` optional int 0–50
  - `deadline`, `interviewRangeStart`, `interviewRangeEnd` ISO strings
  - `interviewCapacity` 1–500
  - `rubric` mandatory/preferred/threshold
  - No `companyName` from the client; derive from the recruiter’s approved company.
- Service checks:
  - recruiter has an `APPROVED` company (FROZEN/ARCHIVED/DELETED rejected)
  - department and branch belong to that company
  - company status allows creation
  - dates obey the same ordering rules, plus deadline future
  - description mandatory
- Create the position with `companyId`, `departmentId`, `branchId`, snapshots, description, years, rubric.

### Public job page and sharing

- Show the job description, branch label/wilaya, department, soft years target (“Preferred proven experience: X+ years”), and mandatory criteria.
- Share bridge description uses the job description (truncated) when present.
- The public API returns description and minimumYearsExperience; it does not expose internal company review fields or recruiter identities.

## Custom date calendars

### Component

- In-repo `DateCalendar`:
  - month header with previous/next controls
  - weekday labels
  - 6-week grid
  - selected day, today marker
  - disabled days with `text-decoration: line-through`, muted color, `aria-disabled`, not clickable
  - keyboard: arrow keys move focus, Enter/Space select, PageUp/PageDown change month, Escape closes
  - min/max dates; `disabledDate(date)` callback
- `TimeField`: native `<input type="time">` or a small hour/minute select; consistent 24-hour display.
- The three fields:
  - **Application close:** disable past dates.
  - **Interviews from:** disable dates before the application close date.
  - **Interviews until:** disable dates before the interviews-from date.
  - Time validation catches same-day ordering (`from` after deadline; `until` after `from`).
- Use the component in the job creation page. Reuse it in the extend-deadline modal if low-risk; otherwise keep the native field there for this iteration.
- No new dependency.

## Matcher changes

### Inputs

The orchestrator loads the position and passes:
- `rubric`: mandatory/preferred/threshold
- `jobDescription`: the position description
- `minimumYearsExperience`: optional soft target
- the candidate dossier as today

### Output

Extend the matcher output:

```text
mandatoryCriteriaAudit: [...]
preferredCriteriaAudit: [...]
descriptionAudit: {
  score: 0..100,
  strengths: string[],
  gaps: string[],
  rationale: string
}
experienceAudit: {
  targetYears: number | null,
  provenYears: number | null,
  score: 0..100,
  rationale: string
}
matchScore: 0..100
category: ELIGIBLE | NEEDS_REVIEW | REDIRECTED
```

**Compatibility:** keep the existing `category` field and its values. The current orchestrator, growth agent, application status mapping, and UI already consume `category`; renaming it would break old `Application.rubricAudit` JSON and every consumer. `descriptionAudit` and `experienceAudit` are additive fields. Old audits without them render a neutral “Not evaluated” state.


### Scoring

- **Mandatory criteria remain hard gates.** All mandatory criteria must be satisfied to be eligible, as today. Years never gate eligibility.
- **Rubric score:** 70% of the overall score (mandatory + preferred evidence).
- **Description score:** 20% when a years target is set; 30% when it is not.
- **Experience score:** 10% when a years target is set; it is a soft curve, not a pass/fail. A candidate below the target is not zeroed out; strong portfolio evidence in the description audit can compensate. A candidate above the target does not automatically become eligible.
- If the dossier cannot prove years, use a neutral experience score and state “years not verifiable” in the audit. The candidate can still be eligible.
- The existing `minimumScoreThreshold` (default 70) applies to the combined score. The `category` mapping keeps the current one-unmet behavior. When every mandatory criterion is satisfied, the result is `ELIGIBLE` above the threshold and `NEEDS_REVIEW` below it — never `REDIRECTED` — so description/experience scores and years cannot turn an evidence-complete candidate into a redirect.
- The LLM prompt includes the description and years with explicit instructions: years are a soft signal; do not reject solely for years; evaluate the portfolio and evidence.
- The heuristic fallback:
  - keeps mandatory criterion matching
  - scores description via keyword/evidence overlap and portfolio artifacts
  - extracts proven years from experience date ranges when possible; otherwise neutral
  - returns the same output shape.

### UI and feedback

- Recruiter pipeline audit sections: “Mandatory rubric”, “Description alignment”, “Experience signal” with scores/gaps/rationale.
- Applicant feedback: include description gaps and an experience note (“Your portfolio can compensate for fewer years”) in the growth letter/gap analysis.
- Public job page: show the description and “Preferred proven experience” (not “Required”).
- Do not display the internal weights or threshold to applicants.

## Migration and seed

- Add the new models/enums and nullable FKs; backfill existing data.
- One-off `backend/scripts/backfill-companies.ts` (supports `--dry-run`):
  - Create **one approved company per recruiter** using `User.companyName`, the first position’s `companyName`, or “Unassigned Company”; do not merge same-name recruiters.
  - Set `employeeCount` 1 for backfilled companies; create departments/branches from existing positions; link positions.
  - Set a legacy description for existing positions and `minimumYearsExperience` null.
  - Write a `CompanyEvent` of type `PROFILE_UPDATED` with note “Backfilled from legacy data” for each company.
  - Create/link any missing company owners.
  - Run inside a transaction; print a summary; abort on validation errors.
- E2E seed updates:
  - Admin account.
  - Approved companies for the existing recruiters, with departments/branches.
  - At least one pending company and one rejected company for admin-flow tests.
  - Positions with descriptions and years targets; link to companies/departments/branches.
  - Recruiters grouped into companies; keep the existing 6/3/35/45 counts where the UX tests depend on them, or update the counts and tests deliberately.
- Local DB: use the project’s chosen schema sync (`prisma db push` or a migration) plus the backfill script. The design flags that no migration history exists.

## Guards and navigation

- Auth user payload includes `companyStatus` and `companyId` for recruiters.
- `RoleHome` for recruiter should resolve by status:
  - DRAFT/REJECTED → `/recruiter/onboarding`
  - PENDING → `/recruiter/status`
  - APPROVED → `/recruiter/positions`
  - FROZEN → `/recruiter/positions` (read-only)
- Admin → `/admin/companies`.
- Recruiter nav:
  - Pending/draft: Company setup / status.
  - Approved: Positions, Company settings, Public jobs preview, Plans.
  - Frozen: same but disabled actions and a banner.
- Admin nav: Companies; no applicant/recruiter links.
- Backend guards:
  - Recruiter routes check company status; create/actions require APPROVED.
  - Frozen read-only routes reject mutations.
  - Admin routes require ADMIN.
  - Public jobs only show APPROVED companies; frozen frozen/archived/deleted jobs hidden.

## Testing

Temporary backend/Playwright checks (no new test framework committed):

- Recruiter signup creates a DRAFT company and redirects to onboarding.
- Onboarding validation: at least one department/branch; employee count required on submit; submit → PENDING; pending page read-only; reject → reason and resubmit.
- Admin approve → recruiter can open the new job page; freeze → read-only banner, public job hidden; unfreeze; archive → login blocked and refresh tokens revoked; restore; soft delete → login blocked and data retained. Verify a frozen/archived direct `/jobs/:id` link and `POST /applicant/applications` are rejected.
- Audit: every admin action writes a `CompanyEvent`; the admin detail shows history; rejection/deletion notes are retained.
- Department/branch removal: deactivation hides them from job-creation dropdowns, preserves old position FKs/snapshots, and the admin sees the inactive state.
- Rename propagation: company/department/branch renames update existing position snapshots.
- Job page: company read-only; department/branch options come from the company; description required; years optional; custom calendars disable past dates and show line-through; dependency constraints; submit creates a position with snapshots and relations.
- Matcher: heuristic fallback returns description/experience audits and a combined score; mandatory criteria still gate; years do not hard-reject; strong description can compensate; `category` remains the existing field and old audits render a neutral state.
- Public job page/share bridge show description/branch/years; frozen/archived companies are hidden.
- Backfill script dry-run on a copy of the DB; verify one company per recruiter, position links, and legacy descriptions.
- Regression: S2, S3, public-share checks, `npm run e2e:test`, TypeScript, Vite build.

## Risks

| Risk | Mitigation |
|---|---|
| Backfill corrupts existing data | Run in a transaction; dry-run mode; E2E re-seed; back up local DB before schema sync. |
| Admin lifecycle edge cases | Explicit status machine, server-side transition checks, audit fields, confirmation modals. |
| Frozen/archived job visibility | Query-level filters for public list/share; applicant interviews remain visible. |
| Matcher prompt change degrades quality | Keep mandatory rubric logic; heuristic fallback; show audits; tune weights with seeded fixtures. |
| Calendar accessibility | Keyboard focus model, aria-disabled, line-through plus text, reduced motion. |
| Job creation page size | Sectioned layout; validation per section; sticky review summary. |
| Multi-recruiter not implemented | Schema supports members; document as follow-up; admin can see owner. |

## Builder calls

- Company onboarding is a single page with sections, not a multi-step wizard, to keep scope contained.
- Employee count is an integer, nullable while DRAFT and required on submit; no revenue/legal registration fields this iteration.
- One company owner at signup; joining an existing company is a follow-up. Positions remain recruiter-owned; company membership does not grant pipeline access in this iteration.
- Backfill creates one company per recruiter rather than merging by name.
- Post-approval company edits do not reset approval; renames propagate to position snapshots; department/branch removal is a soft deactivate.
- A `CompanyEvent` audit trail is added for admin actions and profile changes.
- Archive/delete revoke refresh tokens and recruiter company-status middleware blocks existing access tokens; frozen is read-only.
- Description weights: rubric 70%, description 20%, experience 10% when years are set; rubric 70%, description 30% when not.
- Keep the matcher’s existing `category` field and values; add `descriptionAudit`/`experienceAudit` without renaming.
- Years never gate eligibility; mandatory rubric criteria remain the only hard evidence gates.
- Existing positions get a legacy description; only new positions require the full description.
- Editing published positions is out of scope; the new page is create-only.
- Extend-deadline keeps its native field unless reuse is trivial.
- Admin actions do not send email in this iteration.
- E2E seed will be updated; existing UX checks will be adjusted only where the data model requires it.

## Open decisions for the user

- None blocking after the answers already given. If multiple recruiters per company must be supported in this iteration, that changes the signup/join flow and should be added before implementation.
- If the admin should re-review major company profile changes after approval, that would add a second review state.
- If job editing is required in the same page, add `/recruiter/positions/:id/edit`.
