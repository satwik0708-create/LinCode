# LinCode

A role-based platform covering the full lifecycle from skill assessment to placement:

```
Skill Assessment → Skill Profiling → Skill Gap → Personalised Learning →
Skill Development → Internship → Placement → Digital Portfolio →
Industry/Academia Collaboration → Institutional Analytics
```

Built for Smart India Hackathon, with the architecture kept extensible enough for real
datasets, models, industry integrations and production authentication.

---

## Quick start

```bash
npm install
cp .env.example .env.local          # then fill in SESSION_SECRET
npm run dev                          # http://localhost:3000
```

Generate a signing key:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`npm run dev` runs without `.env.local` — it falls back to a built-in development
key and says so. A production build does not: `npm start` refuses to boot without a
real `SESSION_SECRET` of at least 32 characters, because sessions are signed with it.

Node 20.9 or newer is required.

**On Windows**, start the server from the folder's exact capitalisation. `cd lincode`
into a folder named `LinCode` succeeds — Windows is case-insensitive — but webpack is
not, and it will then compile every dependency twice, once per spelling. Two copies of
Next's router context makes every page throw *"expected layout router to be mounted"*.
`next.config.ts` checks for this at startup and prints the exact fix.

The datastore seeds itself on first run, so the demo accounts work immediately.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm test` | 68 unit and integration tests |
| `npm run seed` | Reset the datastore to its seeded demo state |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

### Demo accounts

Password for all four: `Demo@Skill2026`

| Role | Email | What it shows |
| --- | --- | --- |
| Student | `priya@student.demo` | Four domains, a 7-day streak, live applications, a full portfolio |
| Faculty | `faculty@demo.edu` | FDPs, faculty internships, consultancy, research |
| Industry | `recruiter@nimbus.demo` | Postings, applicant pipeline, training programmes |
| Institution | `cdc@demo.edu` | Cohort analytics, skill gaps, placement progress |

Sign in as each in turn: **each account sees only its own application.** There is no screen
anywhere that shows all four dashboards at once.

A runtime error no longer takes the page with it: each workspace has its own error
boundary, so a failure in one screen leaves the navigation, theme and sign-out working
and offers a retry. `app/global-error.tsx` catches a failure in the root layout itself
and is deliberately self-contained — no providers, no design system, its own styles —
because that is the one case where none of those can be relied on.

### Deploying to a serverless host (Vercel, Netlify)

One variable is required:

| Variable | Value |
| --- | --- |
| `SESSION_SECRET` | 32+ random characters (see above) |

Storage needs no configuration. A serverless host mounts the deployment read-only and
gives exactly one writable location, so the app detects the platform and uses `/tmp`
by default. `DATA_DIR` still overrides that if you want it somewhere specific — but an
empty value is ignored rather than silently falling back to a read-only path.

**`GET /api/health` reports both.** Open it on the deployment and it says which of the
two is wrong, whether the datastore directory is actually writable, and what `DATA_DIR`
resolved to. It returns 200 when the deployment is sound and 503 with a list of problems
when it is not. It never exposes the secret — only whether one is set and long enough.

**`/tmp` is a demo measure, not a deployment.** It is per-instance and cleared on cold
start, so an account created on one request may be gone on the next — and seeded demo
accounts are recreated fresh each time an instance wakes. That is fine for showing the
product and wrong for anything else. Data that has to survive needs a host with a
persistent disk (Render, Railway, Fly.io — no code change, `DATA_DIR` unset) or the real
database `SECURITY.md` describes.

### Signing up live in a demo

Sign-up starts by asking *which role you are joining as* — Student, Faculty, Recruiter or
Institution — and the answer decides both the account's role and the questions onboarding
asks next. To demonstrate that on stage you need addresses that are not already taken, so
these are reserved: nothing seeds them, and `npm run seed` frees them again afterwards.

| Role | Address to sign up with | What onboarding then asks for |
| --- | --- | --- |
| Student | `demo.student@lincode.demo` | Institution, degree, branch, graduation year, CGPA → domains → level per domain → diagnostic |
| Faculty | `demo.faculty@lincode.demo` | Institution, department, current role, date of birth, years in role, expertise |
| Recruiter | `demo.recruiter@lincode.demo` | Company, sector, size, your designation, roles you hire for |
| Institution | `demo.institution@lincode.demo` | The institution (name, type, website, official email, address, city/state, accreditation), then you as its representative |

Any password meeting the strength rules works — `Demo@Skill2026` is convenient because it is
the one already on the fixture accounts. Nothing sends mail, so the address only has to be
unique; append `+2`, `+3` and so on (`demo.student+2@lincode.demo`) to run the same flow twice
without reseeding.

Run `npm run seed` between rehearsals to clear every account created this way.

Reseeding deletes the accounts you created, so a browser still holding one of their
sessions is signed out on its next request and told why — it does not get stuck.

---

## The student journey

```
Landing → Choose role → Sign up → Student profile → Choose one or more domains
       → Choose a level per domain → Diagnostic (intermediate/advanced only)
       → Placement → AI skill-gap analysis → Personalised path → Dashboard
       → Learn → Checkpoint quiz per module → Report naming the gaps it found
       → Track progress → Maintain streak → Update skill profile
       → Internship/job recommendations → Apply → Track → Verified portfolio
```

Three things this flow does that a course catalogue does not:

**The declared level is a hypothesis, not a verdict.** Beginners skip the test. Intermediate
and advanced learners take a diagnostic drawn from *that domain's own* question bank, and the
score decides where they actually start — 0% goes back to the beginning whatever they claimed.
Thresholds live in `src/lib/domain/placement.ts` as data, so a future scoring model can replace
them without touching a single call site.

**Domains are plural and independent.** Enrolment is a list. A student can hold Full Stack,
Machine Learning and Cloud at once; completing AI & Data Science marks that one complete and
leaves the others exactly where they were. New domains can be added at any time from My Learning.

**The path skips what you have proven — and says why.** Every module the engine skips is still
shown, with the evidence: *"Your assessment already demonstrates this (HTML 88%, CSS 82%)."*
Skipped modules do not count against progress, and an advanced learner is never made to repeat
beginner material.

---

## Role-based architecture

Four self-selectable roles — student, faculty, industry, institution — plus an `admin` role
that is provisioned out of band and can never be claimed at registration.

Access control is enforced in three places, and the UI is the least important of them:

1. **`src/middleware.ts`** — edge check on the signed session cookie. A student requesting
   `/institution/analytics` is redirected before the request reaches a server component.
2. **`requireRole()` in `src/lib/auth/guard.ts`** — every role layout re-reads the *live* user
   record. A grant revoked mid-session is caught here even though the cookie still verifies.
3. **The repositories** — ownership checks live next to the data. `advanceApplication` verifies
   the posting belongs to the caller's organisation; `canReadDocument` decides document access;
   `applyToProgram` enforces a programme's audience list. A future caller that forgets to check
   still cannot bypass them.

Navigation is built from a per-role config (`src/lib/navigation.ts`) that is never merged. A
student's rendered HTML contains no faculty, recruiter, institution or admin links at all —
there is nothing to uncover by reading the DOM.

```
/
├── login · signup · forgot-password · reset-password
├── onboarding/
│   ├── role
│   ├── student/{profile,domains,level,assessment,personalized-path}
│   └── {faculty,industry,institution}/profile
├── student/{dashboard,learning,learning/[domainId],assessment,skill-gap,
│            internships,jobs,applications,portfolio,career-advisor,
│            streak,profile,settings}
├── faculty/{dashboard,internships,fdp,training,research,collaboration,applications,settings}
├── industry/{dashboard,internships,jobs,projects,training,applicants,settings}
├── institution/{dashboard,students,skills,internships,placements,analytics,settings}
└── admin/{dashboard,audit}
```

---

## Security

AI-generated application code tends to fail in predictable ways. These are handled explicitly:

| Risk | How it is addressed |
| --- | --- |
| Account enumeration | Login returns one message for every failure and burns equivalent CPU on unknown accounts, so neither the body nor the timing distinguishes them. Password reset always answers *"If an account exists with these details, you'll receive further instructions."* |
| Credential storage | scrypt (N=2¹⁵), per-password salt, parameters embedded in the hash so they can be raised later without invalidating accounts. |
| Session theft | httpOnly + SameSite=Lax + Secure JWT cookie, signed HS256. Unreadable from JavaScript, not sent on cross-site POSTs. Refuses to boot in production without a 32-byte `SESSION_SECRET`. |
| Cross-role access | Middleware, server guards and repository-level ownership checks — three independent layers. |
| IDOR | Assessments, applications, postings and documents are all ownership-checked server-side; a denied document read returns the same 404 as a missing one. |
| CSRF | SameSite cookies plus an explicit origin check on every mutating route. |
| Brute force | Fixed-window rate limits per route class, plus progressive account lockout after 5 failed logins. |
| Injection & bad input | Every request body is parsed by a zod schema before any handler logic runs; bodies over 64 KB are rejected outright. |
| Answer-key leakage | `toClientQuestion()` strips `correctIndex` and `explanation`; grading happens entirely on the server against stored question ids. |
| Secret leakage | No `NEXT_PUBLIC_*` variables exist. `server-only` guards the datastore, auth and AI modules, so importing one into a client component is a build error. |
| Replay | Assessments are single-submission and time-limited; OTPs and reset tokens are stored hashed with an attempt cap and never returned in a response. |
| Silent failure | Denied access, failed logins, role changes and document reads are written to an audit log, visible at `/admin/audit`. |

Response headers are set globally in `next.config.ts`: a CSP that permits no third-party
scripts, `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy and a locked-down
permissions policy.

**Verified end to end** against a running build: all five role areas redirect anonymous users
to sign-in; each signed-in role is bounced out of the other three; a student calling recruiter
APIs directly gets 403; reading another student's document returns the same 404 as a
nonexistent id; a student cannot apply to a faculty-only FDP; login rate-limits after 8
attempts; a cross-origin POST is rejected with 403.

---

## Data & AI layers

**Data.** Everything persists through `read()` / `mutate()` in `src/lib/data/store.ts`, a
JSON-backed store with a serialised write queue. Repositories in `src/lib/data/` are the only
thing the app talks to. Moving to Prisma/Postgres means reimplementing that one layer — no
screen, route handler or AI call site changes. The entity model (`src/lib/types.ts`) is
relational already: users, profiles, skills, domains, courses, modules, progress, streaks,
assessments, gaps, opportunities, applications, collaboration programmes, portfolio items,
documents, notifications and audit events, related by id rather than duplicated.

**Content** — 5 domains, ~50 skills, 55 modules and the diagnostic question banks — lives in
`src/lib/domain/` as code rather than in the datastore, because it is catalogue, not user data.

**AI.** `SkillEngine` in `src/lib/ai/types.ts` is the contract:

```
Student profile + assessment results + skill matrix + module metadata +
industry requirements + job requirements + learning progress + career interests
        ↓
skill profile + skill gaps + recommended learning + personalised path +
career recommendations + internship/job matching
```

The MVP ships `RuleSkillEngine`, a deterministic implementation where every recommendation
carries the reason it was produced. Plugging in a model means writing a second `SkillEngine`
and returning it from `getSkillEngine()`. No provider SDK is referenced anywhere else, and no
UI component knows an engine exists.

---

## Accessibility & appearance

Dark and light mode, and four interface sizes (Small → Extra large), both persisted and applied
to `<html>` before first paint so neither flashes on reload. The size control scales
`--font-scale`, which every rem in the app derives from — so spacing, controls and cards scale
with the text instead of overflowing it.

Status is never carried by colour alone: active navigation uses a bar, a tint and a weight
change together; the portfolio's current subsection is marked four ways at once; verification
and progress states pair colour with an icon or a label. Reduced-motion preferences are
honoured, focus rings are visible in both themes, and every page has a skip-to-content link.

Layouts are built per breakpoint rather than scaled down: the sidebar becomes a drawer that
closes on navigation, filter bars stack, and wide tables scroll inside their own container.

---

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS · shadcn-structured
components on Radix primitives · framer-motion · jose · zod · scrypt via `node:crypto`.
