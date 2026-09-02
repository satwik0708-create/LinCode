import { cookies } from "next/headers";
import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { signupSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { checkPasswordStrength, hashPassword } from "@/lib/auth/password";
import { createSessionToken, sessionCookieOptions, sessionTtl, SESSION_COOKIE } from "@/lib/auth/session";
import { audit, createUser, findUserByEmail, findUserByMobile, toPublicUser } from "@/lib/data/users";
import { clientIp } from "@/lib/auth/guard";

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;

  const limited = rateLimit(request, "signup", RATE_LIMITS.signup);
  if (limited) return limited;

  const parsed = await readJson(request, signupSchema);
  if (!parsed.ok) return parsed.response;
  const { name, email, mobile, password } = parsed.data;

  const strength = checkPasswordStrength(password);
  if (!strength.ok) {
    return fail("Choose a stronger password.", 422, { fields: { password: strength.problems[0] } });
  }

  try {
    const ip = await clientIp();

    // Registration is one of the few places where telling the user an account
    // exists is unavoidable — they need to know to sign in instead. The message
    // is kept identical for both channels so it reveals nothing extra.
    const [byEmail, byMobile] = await Promise.all([
      email ? findUserByEmail(email) : undefined,
      mobile ? findUserByMobile(mobile) : undefined,
    ]);
    if (byEmail || byMobile) {
      await audit({ userId: null, action: "auth.signup", outcome: "failure", ip, detail: "duplicate identifier" });
      return fail("An account already exists with those details. Try signing in instead.", 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ name, email, mobile, passwordHash });

    // No role is granted yet — the user picks one at /onboarding/role, and the
    // session carries an empty grant list until they do.
    const token = await createSessionToken(
      { sub: user.id, name: user.name, roles: [], activeRole: null, onboardingComplete: false },
      sessionTtl(false),
    );
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions(sessionTtl(false)));

    await audit({ userId: user.id, action: "auth.signup", outcome: "success", ip });
    return ok({ user: toPublicUser(user), next: "/onboarding/role" }, { status: 201 });
  } catch (error) {
    return serverError("signup", error);
  }
}
