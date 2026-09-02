import { cookies } from "next/headers";
import { ok, fail, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { updateUser } from "@/lib/data/users";
import { createSessionToken, sessionCookieOptions, sessionTtl, SESSION_COOKIE } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/roles";

/** Marks onboarding done and refreshes the session so the flag stops redirecting. */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "onboard-complete", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize();
  if (!auth.ok) return fail(auth.message, auth.status);

  try {
    const updated = await updateUser(auth.user.id, { onboardingComplete: true });
    if (!updated) return fail("Account not found.", 404);

    const ttl = sessionTtl(false);
    const token = await createSessionToken(
      {
        sub: updated.id, name: updated.name, roles: updated.roles,
        activeRole: updated.activeRole, onboardingComplete: true,
      },
      ttl,
    );
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions(ttl));

    return ok({ next: homeFor(updated.roles, updated.activeRole) });
  } catch (error) {
    return serverError("onboarding complete", error);
  }
}
