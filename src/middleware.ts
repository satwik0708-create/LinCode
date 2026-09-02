import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { canAccess, homeFor, roleForPath } from "@/lib/auth/roles";

/**
 * Edge-side route protection.
 *
 * This is the first gate, not the only one — it rejects the obvious cases
 * (no session, wrong role) before a request reaches a server component, while
 * `requireRole()` re-verifies against the live user record inside the app.
 * A user who guesses `/institution/analytics` is bounced here; a user whose
 * role was revoked mid-session is bounced by the server guard.
 */

const PUBLIC_PATHS = new Set([
  "/", "/login", "/signup", "/forgot-password", "/reset-password", "/about", "/security",
]);

const PROTECTED_PREFIXES = ["/student", "/faculty", "/industry", "/institution", "/admin", "/onboarding"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  // Signed-in users have no business on the auth screens.
  if (session && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL(homeFor(session.roles, session.activeRole), request.url));
  }

  if (!needsAuth || PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  if (!session) {
    const url = new URL("/login", request.url);
    // Preserve the destination so sign-in returns them where they were headed.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Onboarding is reachable by any authenticated user; role areas are not.
  if (pathname.startsWith("/onboarding")) {
    if (pathname.startsWith("/onboarding/student") && !canAccess(session.roles, "student")) {
      return NextResponse.redirect(new URL("/onboarding/role", request.url));
    }
    return NextResponse.next();
  }

  const target = roleForPath(pathname);
  if (target && !canAccess(session.roles, target)) {
    const fallback = session.roles.length ? homeFor(session.roles, session.activeRole) : "/onboarding/role";
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
