import { cookies } from "next/headers";
import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { selectRoleSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { createSessionToken, sessionCookieOptions, sessionTtl, SESSION_COOKIE } from "@/lib/auth/session";
import { assignRole, audit, toPublicUser } from "@/lib/data/users";
import { authorize, clientIp } from "@/lib/auth/guard";
import { ROLE_HOME } from "@/lib/auth/roles";
import type { Role } from "@/lib/types";

/**
 * Role selection at the end of registration.
 *
 * Only the four self-selectable roles are accepted (the schema enforces it), so
 * `admin` can never be claimed here — it is provisioned out of band.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;

  const limited = rateLimit(request, "role", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize();
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, selectRoleSchema);
  if (!parsed.ok) return parsed.response;
  const role = parsed.data.role as Role;

  try {
    const updated = await assignRole(auth.user.id, role);
    if (!updated) return fail("Account not found.", 404);

    const ttl = sessionTtl(false);
    const token = await createSessionToken(
      {
        sub: updated.id,
        name: updated.name,
        roles: updated.roles,
        activeRole: updated.activeRole,
        onboardingComplete: updated.onboardingComplete,
      },
      ttl,
    );
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions(ttl));

    await audit({ userId: updated.id, action: "auth.role.select", outcome: "success", ip: await clientIp(), detail: role });

    const next =
      role === "student"
        ? "/onboarding/student/profile"
        : `/onboarding/${role}/profile`;

    return ok({ user: toPublicUser(updated), next, home: ROLE_HOME[role] });
  } catch (error) {
    return serverError("role selection", error);
  }
}
