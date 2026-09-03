import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { audit } from "@/lib/data/users";
import { getSession } from "@/lib/auth/guard";

const REASONS = new Set(["missing_user", "locked"]);

/**
 * Clear a session cookie that verifies but no longer names a usable account,
 * then hand the visitor to /login.
 *
 * This exists because the two access-control layers can disagree. Middleware
 * trusts the signed cookie and redirects a cookie-bearing visitor away from
 * /login; the server guard re-reads the user record, finds nothing usable and
 * redirects back. Neither can clear the cookie — middleware runs before the
 * record is readable, and a Server Component may not write cookies at all — so
 * the two bounce off each other indefinitely and the page never renders.
 *
 * A Route Handler can delete the cookie, which breaks the cycle at its cause:
 * the next request simply has no session.
 *
 * GET, because it is reached by redirect from a Server Component. It only ever
 * clears the caller's own cookie, so the worst a forged request achieves is
 * signing its own sender out.
 */
export async function GET(request: Request) {
  const session = await getSession();
  const store = await cookies();
  store.delete(SESSION_COOKIE);

  const requested = new URL(request.url).searchParams.get("reason");
  const reason = requested && REASONS.has(requested) ? requested : "missing_user";

  if (session) {
    await audit({ userId: session.sub, action: "auth.session_stale", outcome: "denied", detail: reason });
  }

  const target = new URL(`/login?reason=${reason}`, request.url);
  return NextResponse.redirect(target, {
    // 303 so the redirected request is a fresh GET, and never cached: the
    // response's whole purpose is the Set-Cookie that clears the session.
    status: 303,
    headers: { "Cache-Control": "no-store, private" },
  });
}
