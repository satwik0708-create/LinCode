import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { institutionRegistrationSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { registerInstitution, updateUser } from "@/lib/data/users";
import type { InstitutionType } from "@/lib/types";

/** Step one of institution registration: the institution's own identity. */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "onboard-institution-details", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("institution");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, institutionRegistrationSchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;

  try {
    const institutionId = await registerInstitution({
      name: data.institutionName,
      type: data.type as InstitutionType,
      website: data.website || undefined,
      officialEmail: data.officialEmail,
      address: data.address,
      city: data.city,
      state: data.state,
      accreditation: data.accreditation,
    });
    // Bind the account to the institution so every later query is scoped to it.
    await updateUser(auth.user.id, { institutionId });
    return ok({ next: "representative", institutionId });
  } catch (error) {
    return serverError("institution details", error);
  }
}
