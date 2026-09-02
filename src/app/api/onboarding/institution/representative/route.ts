import { cookies } from "next/headers";
import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { institutionRepresentativeSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { updateUser, upsertInstitutionProfile } from "@/lib/data/users";
import { createSessionToken, sessionCookieOptions, sessionTtl, SESSION_COOKIE } from "@/lib/auth/session";

/** Step two: the person acting for the institution. Completes onboarding. */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "onboard-institution-rep", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("institution");
  if (!auth.ok) return fail(auth.message, auth.status);
  if (!auth.user.institutionId) {
    return fail("Add your institution's details first.", 409, { next: "details" });
  }

  const parsed = await readJson(request, institutionRepresentativeSchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;

  try {
    await upsertInstitutionProfile(auth.user.id, {
      institutionId: auth.user.institutionId,
      designation: data.designation,
      department: data.department,
      officialEmail: data.officialEmail,
      mobile: data.mobile,
      purpose: data.purpose,
    });
    const updated = await updateUser(auth.user.id, { name: data.fullName, onboardingComplete: true });
    if (!updated) return fail("Account not found.", 404);

    // Reissue the session so the completed flag stops redirecting them back.
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

    return ok({ next: "/institution/dashboard" });
  } catch (error) {
    return serverError("institution representative", error);
  }
}
