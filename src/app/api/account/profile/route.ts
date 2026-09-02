import { z } from "zod";
import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { accountUpdateSchema, studentProfileSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { findOrCreateInstitutionByName, updateUser, upsertStudentProfile } from "@/lib/data/users";

const schema = accountUpdateSchema.merge(studentProfileSchema.partial()).extend({
  careerInterests: z.array(z.string().trim().max(60)).max(8).optional(),
});

/** Updates the caller's own profile. There is no user id in the payload. */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "account-profile", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, schema);
  if (!parsed.ok) return parsed.response;
  const { name, ...profileFields } = parsed.data;

  try {
    if (name) await updateUser(auth.user.id, { name });

    const patch: Record<string, unknown> = { ...profileFields };
    if (profileFields.institutionName) {
      patch.institutionId = await findOrCreateInstitutionByName(profileFields.institutionName);
    }
    // Drop undefined so a partial submit never blanks a stored field.
    for (const key of Object.keys(patch)) if (patch[key] === undefined) delete patch[key];

    await upsertStudentProfile(auth.user.id, patch);
    return ok({ saved: true });
  } catch (error) {
    return serverError("account profile", error);
  }
}
