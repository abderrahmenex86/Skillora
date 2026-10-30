# Large Seed Dataset Design

**Date:** 2026-10-30
**Status:** Proposed
**Scope:** Replace the old E2E seed with one larger deterministic dataset for demos, manual QA, and realistic pipeline testing.

## Intent

Provide a single seed command that creates a realistic hiring dataset:

- 2 admins
- 8 recruiters
- 2 recruiters with companies still pending admin approval
- 3 recruiters sharing one approved company
- 3 recruiters in separate approved companies
- 100 applicants
- 16 open jobs with deadlines spread from tomorrow through roughly one month out
- About 100 applications spread across the jobs, so only about 5 applicants have no application
- Some applicants apply to more than one role

The old `backend/scripts/e2e-test-data.ts` file and its `e2e:seed`/`e2e:test` scripts are removed.

## Non-goals

- Changing the Prisma schema.
- Changing matcher behavior or the job creation UI.
- Seeding `SUBMITTED` applications that require the worker to evaluate them.
- Merging or replacing `backend/prisma/seed.ts` (the small demo seed remains).

## Dataset

### Accounts

All accounts use password `password123` and the `@skillora.test` domain.

| Role | Count | Emails |
|------|-------|--------|
| Admin | 2 | `admin@skillora.test`, `admin2@skillora.test` |
| Recruiter | 8 | `e2e.recruiter1@skillora.test` … `e2e.recruiter6@skillora.test`, `e2e.pending@skillora.test`, `e2e.pending2@skillora.test` |
| Applicant | 100 | `e2e.applicant001@skillora.test` … `e2e.applicant100@skillora.test` |

### Companies

Six companies:

| Company | Status | Recruiters | Jobs |
|---------|--------|------------|------|
| Atlas Cloud | APPROVED | 3 (shared company) | 7 |
| Numidia Systems | APPROVED | 1 | 3 |
| Tell Platform | APPROVED | 1 | 3 |
| Sahara Fintech | APPROVED | 1 | 3 |
| Cedar Mobility | PENDING | 1 | 0 |
| Aurassi Energy | PENDING | 1 | 0 |

Each company has at least two departments and two branches, with one active headquarters. Pending companies have completed profiles and a `SUBMITTED` company event, but no positions.

### Jobs

16 positions total:

- 7 at Atlas Cloud, distributed 3/2/2 across its three recruiters.
- 3 each at Numidia Systems, Tell Platform, and Sahara Fintech.
- All positions are `OPEN`, with descriptions, rubrics, interview capacity, and recruiter slots.
- Deadlines are evenly spread from **tomorrow** to **30 days from now**:
  `1, 3, 5, 7, … 29, 30` days.
- Interview windows run from the deadline plus one day to the deadline plus seven days.
- Positions remain recruiter-owned; shared company membership does not grant pipeline access to another recruiter.

### Applicants

Each applicant receives:

- A complete applicant profile with title, summary, and skills.
- One education entry, one experience entry, one project, one certification, and one link.
- Deterministic data chosen from small name/skill/wilaya pools.
- A title and skills generated from the applicant's first application position and status, so every rubric audit and rejection letter cites evidence that actually exists in the profile. Applicants without applications keep a generic profile.

### Applications

100 applications total:

- 95 applicants have at least one application.
- 5 applicants have no application.
- 5 applicants apply to two roles, producing the extra 5 applications.
- 4 jobs receive 7 applications; 12 jobs receive 6.
- Status mix per job:
  - 1 `INTERVIEW_SCHEDULED`
  - 1 `ON_HOLD`
  - 1 or 2 `NEEDS_REVIEW`
  - the rest `REJECTED`
- Every applied application has a match score, rubric audit, description audit, and experience audit.
- Rejected applications include a gap analysis with a feedback letter, description gaps, and an experience note.
- Scheduled interviews create `InterviewEvent` records with future confirmed slots and meeting links.
- Every application creates a candidate notification through `notifyApplicationStatus`.

## Command and behavior

New file: `backend/scripts/seed-large.ts`.

Package scripts:

```json
"seed:large": "tsx scripts/seed-large.ts",
"seed:large:verify": "tsx scripts/seed-large.ts --verify"
```

Behavior:

- `--dry-run` prints the planned counts and removes nothing.
- Without `--dry-run`, deletes all users whose email ends with `@skillora.test` (cascades to their companies, positions, applications, interviews, messages, and tokens), then creates the dataset.
- After seeding, prints a summary with counts and login examples.
- `--verify` additionally checks the seeded state through the running API:
  - admin login and company list
  - one shared-company recruiter sees only their own positions
  - one pending recruiter is blocked from recruiter reads
  - one applicant sees their applications and calendar
  - public jobs include active approved-company positions and exclude pending companies

## Removals and documentation

- Delete `backend/scripts/e2e-test-data.ts`.
- Remove `e2e:seed` and `e2e:test` from `backend/package.json`.
- Update `README.md`: replace E2E seed instructions, counts, accounts, and commands with `seed:large`/`seed:large:verify`.
- Leave `backend/prisma/seed.ts` and `prisma:seed` untouched.

## Verification

- `npm run seed:large -- --dry-run` prints the plan without writes.
- `npm run seed:large` completes and prints the expected counts.
- Database assertions:
  - 2 admins
  - 8 recruiters
  - 6 companies, 4 approved and 2 pending
  - 1 approved company with 3 recruiter members
  - 100 applicants
  - 16 open jobs
  - earliest deadline ≈ tomorrow, latest ≈ 30 days out
  - 100 applications
  - 5 applicants with zero applications
  - 5 applicants with two applications
- `npm run seed:large:verify` passes against the running backend.
- Backend `tsc --noEmit` passes.

## Open questions

None.
