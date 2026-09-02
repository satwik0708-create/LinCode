import { cookies } from "next/headers";
import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { otpVerifySchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { verifyOtp } from "@/lib/auth/challenges";
import { createSessionToken, sessionCookieOptions, sessionTtl, SESSION_COOKIE } from "@/lib/auth/session";
import { audit, findUserByMobile, recordSuccessfulLogin, toPublicUser, updateUser } from "@/lib/data/users";
import { homeFor } from "@/lib/auth/roles";
import { clientIp } from "@/lib/auth/guard";

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;

  const limited = rateLimit(request, "otp-verify", RATE_LIMITS.otpRequest);
  if (limited) return limited;

  const parsed = await readJson(request, otpVerifySchema);
  if (!parsed.ok) return parsed.response;
  const { mobile, code, remember } = parsed.data;

  try {
    const ip = await clientIp();
    // Verify the challenge before looking anything up, so an invalid code
    // reveals nothing about whether the number is registered.
    const valid = verifyOtp(mobile, code);
    const user = valid ? await findUserByMobile(mobile) : undefined;

    if (!valid || !user) {
      await audit({ userId: null, action: "auth.otp.verify", outcome: "failure", ip });
      return fail("That code is not valid or has expired.", 401);
    }

    await Promise.all([recordSuccessfulLogin(user.id), updateUser(user.id, { mobileVerified: true })]);

    const ttl = sessionTtl(remember);
    const token = await createSessionToken(
      {
        sub: user.id, name: user.name, roles: user.roles,
        activeRole: user.activeRole, onboardingComplete: user.onboardingComplete,
      },
      ttl,
    );
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions(ttl));

    await audit({ userId: user.id, action: "auth.otp.verify", outcome: "success", ip });

    const next = user.roles.length
      ? user.roles.includes("student") && !user.onboardingComplete
        ? "/onboarding/student/profile"
        : homeFor(user.roles, user.activeRole)
      : "/onboarding/role";

    return ok({ user: toPublicUser(user), next });
  } catch (error) {
    return serverError("otp verify", error);
  }
}
