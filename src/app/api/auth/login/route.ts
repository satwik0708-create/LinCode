import { cookies } from "next/headers";
import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { loginSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { fakeVerify, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, sessionCookieOptions, sessionTtl, SESSION_COOKIE } from "@/lib/auth/session";
import {
  audit, findUserByEmail, findUserByMobile, isLocked,
  recordFailedLogin, recordSuccessfulLogin, toPublicUser,
} from "@/lib/data/users";
import { homeFor } from "@/lib/auth/roles";
import { clientIp } from "@/lib/auth/guard";

/** One message for every failure mode, so the response never confirms an account exists. */
const GENERIC_FAILURE = "Those details don't match an account. Check them and try again.";

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;

  const limited = rateLimit(request, "login", RATE_LIMITS.login);
  if (limited) return limited;

  const parsed = await readJson(request, loginSchema);
  if (!parsed.ok) return parsed.response;
  const { method, email, mobile, password, remember } = parsed.data;

  try {
    const ip = await clientIp();
    const user = method === "email" ? await findUserByEmail(email!) : await findUserByMobile(mobile!);

    if (!user) {
      // Burn comparable CPU so response timing does not distinguish
      // "no such account" from "wrong password".
      await fakeVerify();
      await audit({ userId: null, action: "auth.login", outcome: "failure", ip, detail: "unknown identifier" });
      return fail(GENERIC_FAILURE, 401);
    }

    if (isLocked(user)) {
      await audit({ userId: user.id, action: "auth.login", outcome: "denied", ip, detail: "locked" });
      return fail("Too many failed attempts. Try again in a few minutes.", 423);
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      await recordFailedLogin(user.id);
      await audit({ userId: user.id, action: "auth.login", outcome: "failure", ip, detail: "bad password" });
      return fail(GENERIC_FAILURE, 401);
    }

    await recordSuccessfulLogin(user.id);

    const ttl = sessionTtl(remember);
    const token = await createSessionToken(
      {
        sub: user.id,
        name: user.name,
        roles: user.roles,
        activeRole: user.activeRole,
        onboardingComplete: user.onboardingComplete,
      },
      ttl,
    );
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions(ttl));

    await audit({ userId: user.id, action: "auth.login", outcome: "success", ip });

    const next = user.roles.length
      ? user.roles.includes("student") && !user.onboardingComplete
        ? "/onboarding/student/profile"
        : homeFor(user.roles, user.activeRole)
      : "/onboarding/role";

    return ok({ user: toPublicUser(user), next });
  } catch (error) {
    return serverError("login", error);
  }
}
