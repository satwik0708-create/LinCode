import { ok, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { issueResetToken } from "@/lib/auth/challenges";
import { audit, findUserByEmail, findUserByMobile } from "@/lib/data/users";
import { clientIp } from "@/lib/auth/guard";
import { fakeVerify } from "@/lib/auth/password";

/**
 * Password reset request.
 *
 * Always returns the same message and takes roughly the same time, whether or
 * not an account exists. This endpoint is a classic account-enumeration oracle
 * and is deliberately built not to be one.
 */
const GENERIC = "If an account exists with these details, you'll receive further instructions shortly.";

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;

  const limited = rateLimit(request, "forgot", RATE_LIMITS.passwordReset);
  if (limited) return limited;

  const parsed = await readJson(request, forgotPasswordSchema);
  if (!parsed.ok) return parsed.response;
  const { email, mobile } = parsed.data;

  try {
    const user = email ? await findUserByEmail(email) : mobile ? await findUserByMobile(mobile) : undefined;

    if (user) {
      issueResetToken(user.id);
    } else {
      // Equalise timing against the token-issuing branch.
      await fakeVerify();
    }

    await audit({ userId: user?.id ?? null, action: "auth.password.forgot", outcome: "success", ip: await clientIp() });
    return ok({ message: GENERIC });
  } catch (error) {
    return serverError("forgot password", error);
  }
}
