# Security notes

## Reporting

This is a hackathon MVP. If you find a vulnerability, open an issue describing the impact and
the steps to reproduce it. Do not include working credentials or personal data in the report.

## What is production-ready as written

- Password hashing (scrypt, salted, tunable parameters stored in the hash).
- Session tokens (HS256 JWT in an httpOnly + SameSite=Lax + Secure cookie), which refuse to
  issue in production without a 32-byte `SESSION_SECRET`.
- Server-side authorisation on every role area and every mutating endpoint, re-checked against
  the live user record rather than the cookie alone.
- Input validation with zod on every request body, with a 64 KB body cap.
- Account-enumeration protection on login, OTP request and password reset — identical
  responses and equalised timing.
- Origin checks on all state-changing requests.
- Audit logging of authentication, role changes and denied access.
- Response headers: CSP with no third-party script origins, `X-Frame-Options: DENY`, nosniff,
  strict referrer policy, restrictive permissions policy.

## What must change before a real deployment

| Component | MVP behaviour | Production requirement |
| --- | --- | --- |
| Datastore | JSON file under `DATA_DIR`, single process | A real database with row-level access rules; reimplement `src/lib/data/store.ts` |
| Rate limiting | In-memory, per instance | Redis or an edge rate limiter, so limits hold across instances |
| OTP / reset delivery | Logged to the server console | A real SMS and transactional email provider |
| Document storage | Metadata only; `GET /api/documents/[id]` returns an authorised descriptor | Stream from object storage **after** the same `canReadDocument` check, with signed short-lived URLs |
| Upload validation | Not implemented — no upload endpoint exists yet | Enforce content-type allow-lists, size caps, extension checks and malware scanning before anything is stored |
| Email/mobile verification | Accounts are usable before verification | Require verification before applying or being surfaced to recruiters |
| Session revocation | Stateless tokens expire naturally | A revocation list or short-lived tokens with refresh, so a sign-out or role change invalidates immediately |
| Audit log | Bounded in-process array | Append-only storage outside the application, with alerting on repeated denials |

## Threat notes

- **`admin` is not selectable.** `SELECTABLE_ROLES` excludes it and the role endpoint validates
  against that list, so the platform-analytics and audit surfaces cannot be self-granted.
- **Admin is not a superuser.** `canAccess` requires an explicit grant per role area; an admin
  account needs the `institution` role granted to it to see institutional data.
- **Recruiters see a projection, not a student.** `getApplicants` returns only the fields a
  recruiter needs. A student's learning history, streak and other applications are never
  included in that payload.
- **Institutions are scoped by `institutionId`** taken from the authenticated user's own record.
  No request parameter can widen that scope.
