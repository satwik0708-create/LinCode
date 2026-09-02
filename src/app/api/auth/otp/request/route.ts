import { ok, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { otpRequestSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { issueOtp } from "@/lib/auth/challenges";
import { audit, findUserByMobile } from "@/lib/data/users";
import { clientIp } from "@/lib/auth/guard";

/**
 * Request a one-time code.
 *
 * The response is identical whether or not the number is registered — an
 * attacker cannot use this endpoint to discover which numbers hold accounts.
 * A code is only actually issued when the account exists.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;

  const limited = rateLimit(request, "otp", RATE_LIMITS.otpRequest);
  if (limited) return limited;

  const parsed = await readJson(request, otpRequestSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const user = await findUserByMobile(parsed.data.mobile);
    if (user) issueOtp(parsed.data.mobile);
    await audit({
      userId: user?.id ?? null, action: "auth.otp.request",
      outcome: "success", ip: await clientIp(),
    });
    return ok({
      message: "If that number is registered, a 6-digit code is on its way. It expires in 5 minutes.",
    });
  } catch (error) {
    return serverError("otp request", error);
  }
}
