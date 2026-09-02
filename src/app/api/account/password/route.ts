import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { changePasswordSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize, clientIp } from "@/lib/auth/guard";
import { checkPasswordStrength, hashPassword, verifyPassword } from "@/lib/auth/password";
import { audit, findUserById, updateUser } from "@/lib/data/users";

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "change-password", RATE_LIMITS.passwordReset);
  if (limited) return limited;

  const auth = await authorize();
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, changePasswordSchema);
  if (!parsed.ok) return parsed.response;

  try {
    // Re-authenticate before changing the credential — a hijacked session
    // should not be enough to lock the real owner out.
    const user = await findUserById(auth.user.id);
    if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      await audit({ userId: auth.user.id, action: "account.password", outcome: "failure", ip: await clientIp() });
      return fail("Your current password is not correct.", 401, { fields: { currentPassword: "Incorrect password." } });
    }

    const strength = checkPasswordStrength(parsed.data.newPassword);
    if (!strength.ok) {
      return fail("Choose a stronger password.", 422, { fields: { newPassword: strength.problems[0] } });
    }

    await updateUser(user.id, { passwordHash: await hashPassword(parsed.data.newPassword) });
    await audit({ userId: user.id, action: "account.password", outcome: "success", ip: await clientIp() });

    return ok({ message: "Password updated." });
  } catch (error) {
    return serverError("change password", error);
  }
}
