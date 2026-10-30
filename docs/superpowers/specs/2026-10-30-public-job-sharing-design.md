# Public job listings & LinkedIn sharing — design

**Date:** 2026-10-30
**Status:** proposed
**Scope:** public job discovery, shareable job links with rich previews, guest registration return path, and the on-hold applicant message.

## Intent

Recruiters need to share a specific job post to LinkedIn, WhatsApp, or anywhere else. The shared URL must show a job-specific preview, open the exact job in Skillora, and route the visitor into the right action:

- signed-in applicant → apply
- signed-out visitor → read the post, then register or log in with a return to the job

This requires making job listings public. It also gives on-hold candidates a clearer, more accurate explanation of why they are waiting.

## Goals

1. Make `GET /api/v1/public/positions` and `GET /api/v1/public/positions/:id` public.
2. Expose public SPA routes `/jobs` and `/jobs/:jobId`.
3. Add a server-rendered share bridge at `/share/jobs/:jobId` with job-specific Open Graph and Twitter meta tags.
4. Add **Share on LinkedIn** and **Copy link** actions to the job detail.
5. Send guests from a job to registration with a safe redirect back to that job; offer login as the secondary path.
6. Add Jobs to the public navigation and landing CTAs.
7. Replace the `ON_HOLD` message copy with the shortlist explanation the user specified.
8. Keep applicant-only actions and recruiter-only data behind authentication.

## Non-goals

- Full SSR or SEO for every page. Only the share bridge is server-rendered.
- Candidate/profile sharing. The user clarified that “provisional sharing” means sharing a job post.
- Posting to LinkedIn through its API. We will use LinkedIn’s `share-offsite` URL.
- Job alerts, newsletters, or share analytics.
- A new role or external hiring-manager portal.

## Anti-goals

- Do not expose applicant identities, resumes, messages, or recruiter notes on public routes.
- Do not let a signed-out visitor apply without creating an account.
- Do not create a second source of truth for positions or duplicate the position query in several places.
- Do not use an open redirect. Only same-origin `/jobs/:id` destinations are allowed.

## Constraints

- The frontend is a Vite SPA; the backend is Express. There is no SSR in the app today.
- The current public position endpoints exist but are incorrectly protected by `requireAuth`.
- The share bridge must be served from the public app origin. In development, add a Vite proxy for `/share`; in production, the reverse proxy must route `/share` to the backend.
- `CLIENT_URL` is the public frontend origin and the source of the redirect target.
- Helmet applies globally. Avoid an inline-script redirect; use a meta refresh with a visible fallback link.
- The auth redirect helper (`normalizeRedirect`) already rejects external origins and `/auth` destinations.

## Approaches considered

### A. Client-side share links only

Use a public `/jobs/:jobId` SPA route and LinkedIn/copy buttons. Simple, no backend share page. LinkedIn previews would use the generic site metadata because its crawler does not execute the SPA.

### B. Client-side share links + server-rendered Open Graph bridge — chosen

Build A, then add `GET /share/jobs/:jobId` returning job-specific meta tags and a redirect to the SPA. The share UI uses the bridge URL. This gives rich previews without moving the whole app to SSR.

### C. Full SSR/SSG for the job board

Rejected for this iteration. It would improve SEO but adds a rendering stack and deployment surface disproportionate to the sharing need.

## Design

### 1. Public position API

`backend/src/modules/public/public.routes.ts`:

- Remove `requireAuth` from both position routes.
- `GET /public/positions` keeps its active-only filter (`status: OPEN`, deadline in the future).
- `GET /public/positions/:id` returns `OPEN` and `CLOSED` positions so a shared link can show a closed state. It returns 404 for missing IDs and for `DRAFT` positions.
- Public fields: `id`, `companyName`, `title`, `department`, `location`, `deadline`, `status`, `interviewCapacity`, `interviewRangeStart`, `interviewRangeEnd`, `rubric.mandatoryCriteria`, `createdAt`. Do **not** expose `rubric.preferredCriteria` or `rubric.minimumScoreThreshold`; those are evaluation policy, not job-post copy. The current UI only renders mandatory criteria anyway.
- It never returns recruiter or applicant data.
- Extract the shared `select` and lookup into a small `publicPosition` helper/service so the API and share bridge do not drift.
- Keep `/public/companies` behavior unchanged.

### 2. Public SPA routes and deep links

`frontend/src/App.tsx`:

- `/jobs` and `/jobs/:jobId` are public; remove the `SignedInRoute` wrapper for Jobs.
- Keep `/applicant/*`, `/recruiter/*`, and `/settings/*` protected.

`frontend/src/views/guest/JobsExplorerView.tsx`:

- Read `jobId` with `useParams`.
- Selecting a job navigates to `/jobs/:jobId`; the back control goes to `/jobs`.
- When `jobId` is missing, desktop shows the first active job detail and mobile shows the list.
- When `jobId` is present, the detail is selected. If it is not in the active list, fetch `/public/positions/:id` to show a closed/expired state; if the ID is invalid, show “This role is no longer available” and a link to open roles.
- Compute `isJobOpen` from status and deadline. Closed jobs render read-only details and an “Applications closed” panel.
- Set `document.title` to the job title while the job is selected; restore the default on unmount.

### 3. Share bridge with Open Graph tags

`backend/src/modules/public/public.routes.ts` (or a dedicated `public.share.ts`):

`GET /share/jobs/:id` returns HTML, not JSON:

- `<title>` and `<meta name="description">`
- `og:type=website`, `og:site_name=Skillora`, `og:title`, `og:description`, `og:url`, `og:image`
- `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`
- `link rel=canonical` to `${CLIENT_URL}/jobs/:id`
- `meta name="robots" content="index,follow"`
- `meta http-equiv="refresh" content="0;url=${CLIENT_URL}/jobs/:id"`
- a visible “View this job on Skillora” fallback link

Implementation notes:

- HTML-escape every interpolated value (title, company, department, location).
- `og:url` is the share bridge URL: `${CLIENT_URL}/share/jobs/:id`.
- Description: `${department} · ${location}. Apply on Skillora and get a verified outcome.` For closed jobs, “Applications are closed. Browse open roles on Skillora.”
- Add a default 1200×630 brand image at `frontend/public/og/skillora-og.png` and point `og:image` at `${CLIENT_URL}/og/skillora-og.png`.
- Unknown IDs return a small 404 HTML page with a link to `${CLIENT_URL}/jobs`.
- `Cache-Control: public, max-age=300` so a closed job is not cached indefinitely.
- Add `/share` to the Vite dev proxy.
- Share origin is configurable: `VITE_SHARE_ORIGIN` lets the frontend construct the bridge URL when the bridge is not proxied on the app origin. The default is the current origin with the `/share` proxy. In production, either proxy `/share` on the public origin or set `VITE_SHARE_ORIGIN` to the backend’s public origin. The bridge derives `og:url` from the incoming request host and redirects to `CLIENT_URL`.
- Production must also serve the SPA fallback for `/jobs/*`; Vite handles it in development. The repo has no deployment config today, so this is documented as a deployment requirement rather than implemented infrastructure.

### 4. Share UI

On the job detail, add a compact share row:

- **LinkedIn** — `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
- **Copy link** — copies the share bridge URL; shows “Copied” for ~2 seconds, with `aria-live="polite"`; falls back to a prompt if the Clipboard API is unavailable.
- If `navigator.share` exists, add a **Share** button that invokes the native share sheet with the bridge URL. This is progressive enhancement only.
- The share URL is `${window.location.origin}/share/jobs/${job.id}`. The bridge URL is used (not the raw SPA URL) so LinkedIn receives the job-specific meta tags.

### 5. Guest and signed-in actions

- Guest: show the full job post and a primary **Create an account to apply** link to `/auth?mode=register&redirect=${encodeURIComponent(`/jobs/${job.id}`)}`. Add a secondary **Already have an account? Log in** link with the same redirect.
- Signed-in applicant: existing apply flow with tailored resume selection.
- Signed-in recruiter: existing “Recruiters can’t apply” note.
- After registration/login, `AuthView` already honors the `redirect` query and returns the user to `/jobs/:jobId`.
- New applicants with no tailored resume already see the “Create Tailored Resume” prompt inside the apply modal.

### 6. Public navigation and landing CTAs

- Add `{ to: '/jobs', label: 'Jobs' }` to the public nav and the mobile drawer.
- Landing page guest hero secondary → **Explore Jobs** (`/jobs`).
- Landing applicant-section guest secondary → **Explore open roles** (`/jobs`).
- Recheck the 768px header for crowding after adding the sixth public link; reduce the `md` gap or hide a secondary item if necessary.

### 7. On-hold message

Update `statusCopy('ON_HOLD')` in `backend/src/services/messages.ts`:

> **You are still shortlisted**
>
> Your qualifications meet the requirements for **[role] at [company]**, but other better-suited candidates were selected because the number of interview seats is limited. You are still shortlisted — if one of the top candidates changes their mind, we will send you an invitation.

- Apply to both the manual **Keep on hold** action and the automatic waitlist when capacity is full. Both already call `notifyApplicationStatus('ON_HOLD')`.
- Use “their mind” rather than “his mind” in UI copy.
- **Closed positions:** do not promise a future invitation when the position is `CLOSED`. `notifyApplicationStatus` will select the position status and, for a closed role, send: “The position has closed. Your application remains in the talent pool; we will contact you if the team reopens the role.” Open positions get the shortlist copy above. This avoids an unkeepable promise when `closePosition` leaves applications on hold.
- **Manual holds with free seats:** the manual HOLD action describes itself as “waitlisted for the next available seat,” so the shortlist copy applies to every `ON_HOLD` transition while the position is open. There is no separate hold-reason field today; adding one is out of scope.
- Add a small helper under the applicant’s `ON_HOLD` application card: “You remain shortlisted. We’ll invite you if a seat opens.” The inbox message remains the source of the full explanation.

## Decisions made by the builder

- The share bridge lives on the public app origin via `/share` proxy, not a separate `api.` host.
- Use meta refresh, not an HTTP redirect, so crawlers can read the OG tags from the bridge response.
- Show guests the job before registration; do not redirect on page load.
- Include LinkedIn, copy-link, and native share (when available); no other networks in this iteration.
- Keep closed jobs viewable with an “applications closed” state rather than a hard 404.
- Use a single default OG image; job-specific generated images are out of scope.
- Add the on-hold helper text in addition to the inbox message.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| LinkedIn may cache a stale preview | 5-minute bridge cache; LinkedIn’s own cache is outside our control. Document a Post Inspector refresh when needed. |
| Meta refresh may be followed by some crawlers | OG tags are in the initial HTML; the fallback link remains. If previews fail, switch to a bot-aware bridge in a later iteration. |
| Public endpoint abuse | Read-only, no applicant data; existing global limits remain. Add rate limiting later if needed. |
| Sixth public nav item crowds tablet | Measure at 768px; tighten gaps or move About Us into the drawer if required. |
| Open redirect | Use the existing `normalizeRedirect`; only same-origin `/jobs/:id` values are generated. |
| Share bridge on a separate origin in production | Document the `/share` reverse-proxy requirement and keep `CLIENT_URL` as the public origin. |

## Testing

The repo has no automated test framework or test script, and the previous audits deliberately used temporary browser checks rather than committing regression infrastructure. This iteration keeps that boundary.

- **Temporary backend checks:** a Node script using `fetch` against the running API verifies unauthenticated `/public/positions` and `/public/positions/:id`, the public payload subset, share bridge HTML/OG tags/escaping, and the 404 page.
- **Temporary Playwright checks:** a script outside the repo (as used for the S3/S2 audits) verifies guest `/jobs/:id`, the register CTA and redirect, the LinkedIn href, copy-link feedback, URL updates when selecting a job, Jobs in public nav, closed-job state, and the signed-in applicant apply flow.
- **On-hold check:** a temporary API-driven test sets a seeded candidate on hold as a recruiter, reads the applicant message, and asserts the new copy; re-seed afterward.
- **Regression:** re-run the temporary S3 and S2 checks (not committed suites) plus `tsc` and the Vite production build.
- **Manual:** LinkedIn Post Inspector against a deployed bridge URL; localhost previews are not representative.
- No new test dependency, CI job, or committed test suite is part of this iteration unless requested separately.

## Rollout

- Frontend: Vite proxy `/share`; production reverse proxy must send `/share/*` to Express.
- Backend: `CLIENT_URL` must be the public frontend origin; share bridge uses it for `og:url`, canonical, image, and redirect.
- Add the default OG image to `frontend/public/og/skillora-og.png`.
- Update README API/routes documentation and the “public job explorer” feature notes.
- Re-seed E2E data after interactive on-hold tests.

## Out of scope

- Server-rendered job pages for search engines beyond the share bridge.
- Job-specific OG images.
- LinkedIn API integration, UTM attribution, or share analytics.
- Candidate sharing or external hiring-manager accounts.
