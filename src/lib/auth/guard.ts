import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "./session";
import { canAccess, homeFor } from "./roles";
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
  const session = await getSession();
  if (!session) return null;
  const user = await findUserById(session.sub);
  if (!user || isLocked(user)) return null;
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
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
