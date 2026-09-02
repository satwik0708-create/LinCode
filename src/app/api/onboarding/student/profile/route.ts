import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { studentProfileSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { findOrCreateInstitutionByName, updateUser, upsertStudentProfile } from "@/lib/data/users";

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "onboard-profile", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, studentProfileSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const institutionId = await findOrCreateInstitutionByName(parsed.data.institutionName);
    // The profile is always written for the authenticated user — the request
    // body never carries a user id, so one student cannot write another's row.
    await upsertStudentProfile(auth.user.id, { ...parsed.data, institutionId });
    await updateUser(auth.user.id, { institutionId });
    return ok({ next: "/onboarding/student/domains" });
  } catch (error) {
    return serverError("student profile", error);
  }
}
