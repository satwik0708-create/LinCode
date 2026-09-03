import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "./session";
import { canAccess, homeFor, STALE_SESSION_PATH } from "./roles";
import { findUserById, isLocked } from "@/lib/data/users";
import type { Role, User } from "@/lib/types";

/**
 * Server-side access control.
 *
 * `middleware.ts` gives a fast first pass on the signed cookie, but it is not
 * the authority: it cannot see revoked roles or locked accounts. Every server
 * component and route handler that touches role-scoped data calls one of these,
 * which re-reads the user record and re-checks the grant. Hiding a nav link is
 * never the control — this is.
 */

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Session plus the live user record. Returns null if either is invalid. */
export async function getCurrentUser(): Promise<User | null> {
  return (await resolveSession()).user;
}

/**
 * Why a session did not produce a usable user.
 *
 * The distinction matters: "no cookie" and "cookie whose user is gone or
 * locked" look identical to a caller wanting a `User`, but they need opposite
 * handling. Middleware trusts the signed cookie and bounces a cookie-bearing
 * visitor off /login; this layer re-reads the record and bounces them back.
 * Left undistinguished, those two redirects chase each other forever, which is
 * what "the page never loads" looks like from a browser.
 */
type SessionOutcome =
  | { user: User; stale: null }
  | { user: null; stale: "none" | "missing_user" | "locked" };

async function resolveSession(): Promise<SessionOutcome> {
  const session = await getSession();
  if (!session) return { user: null, stale: "none" };

  const user = await findUserById(session.sub);
  // The cookie verifies but names nobody: the datastore was reset or the
  // account was deleted while this session was still valid.
  if (!user) return { user: null, stale: "missing_user" };
  if (isLocked(user)) return { user: null, stale: "locked" };
  return { user, stale: null };
}

/**
 * A Server Component cannot clear a cookie — only a Route Handler or Server
 * Action can — so a visitor whose cookie is valid but unusable is redirected
 * through STALE_SESSION_PATH, which deletes it and forwards to /login. Once the
 * cookie is gone, middleware stops treating them as signed in and the loop
 * cannot re-form.
 */
export async function requireUser(): Promise<User> {
  const { user, stale } = await resolveSession();
  if (user) return user;
  if (stale === "none") redirect("/login");
  redirect(`${STALE_SESSION_PATH}?reason=${stale}`);
}

/** Require an authenticated user who has finished onboarding for `role`. */
export async function requireRole(role: Role): Promise<User> {
  const user = await requireUser();

  if (!canAccess(user.roles, role)) {
    // Send them to their own area rather than leaking that this one exists.
    redirect(user.roles.length ? homeFor(user.roles, user.activeRole) : "/onboarding/role");
  }

  if (role === "student" && !user.onboardingComplete) {
    redirect("/onboarding/student/profile");
  }

  return user;
}

/** For API routes: returns the user or an error response, never redirects. */
export async function authorize(role?: Role): Promise<
  { ok: true; user: User } | { ok: false; status: 401 | 403; message: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, message: "Sign in to continue." };
  if (role && !canAccess(user.roles, role)) {
    return { ok: false, status: 403, message: "You do not have access to this resource." };
  }
  return { ok: true, user };
}

/**
 * Reject cross-site state-changing requests.
 *
 * The session cookie is SameSite=Lax, which already blocks cross-site POSTs from
 * carrying it; this is the belt-and-braces origin check on top.
 */
export async function verifyOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return true; // Same-origin form posts and server-side calls omit it.
  const host = h.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
