import { cookies } from "next/headers";
import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { consumeResetToken } from "@/lib/auth/challenges";
import { checkPasswordStrength, hashPassword } from "@/lib/auth/password";
import { audit, updateUser } from "@/lib/data/users";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { clientIp } from "@/lib/auth/guard";

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;

  const limited = rateLimit(request, "reset", RATE_LIMITS.passwordReset);
  if (limited) return limited;

  const parsed = await readJson(request, resetPasswordSchema);
  if (!parsed.ok) return parsed.response;
  const { token, password } = parsed.data;

  const strength = checkPasswordStrength(password);
  if (!strength.ok) {
    return fail("Choose a stronger password.", 422, { fields: { password: strength.problems[0] } });
  }

  try {
    const userId = consumeResetToken(token);
    if (!userId) {
      await audit({ userId: null, action: "auth.password.reset", outcome: "failure", ip: await clientIp() });
      return fail("That reset link is invalid or has expired. Request a new one.", 400);
    }

    await updateUser(userId, {
      passwordHash: await hashPassword(password),
      failedLoginCount: 0,
      lockedUntil: undefined,
    });

    // Drop any session the browser is holding so the reset ends every old login.
    const store = await cookies();
    store.delete(SESSION_COOKIE);

    await audit({ userId, action: "auth.password.reset", outcome: "success", ip: await clientIp() });
    return ok({ message: "Your password has been reset. Sign in with your new password.", next: "/login" });
  } catch (error) {
    return serverError("reset password", error);
  }
}
