import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { postTrainingSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { createTrainingProgram } from "@/lib/data/opportunities";
import { audit } from "@/lib/data/users";
import { getSkill } from "@/lib/domain/skills";

/**
 * Publish a training programme for students.
 *
 * Like a job posting, the organisation comes from the authenticated recruiter's
 * account and never from the body, so a programme cannot be published under
 * another employer's name.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "post-training", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("industry");
  if (!auth.ok) return fail(auth.message, auth.status);
  if (!auth.user.organizationId) return fail("Complete your organisation profile first.", 400);

  const parsed = await readJson(request, postTrainingSchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;

  try {
    const unknown = data.skillIds.filter((id) => !getSkill(id));
    if (unknown.length) {
      return fail("Some selected skills are not recognised.", 422, { fields: { skillIds: unknown.join(", ") } });
    }

    const program = await createTrainingProgram({
      organizationId: auth.user.organizationId,
      postedByUserId: auth.user.id,
      title: data.title,
      description: data.description,
      kind: data.kind,
      domainIds: data.domainIds,
      skillIds: data.skillIds,
      level: data.level,
      durationWeeks: data.durationWeeks,
      mode: data.mode,
      certificateOffered: data.certificateOffered,
      seats: data.seats,
      startsOn: new Date(data.startsOn).toISOString(),
      status: "open",
    });

    await audit({ userId: auth.user.id, action: "training.create", outcome: "success", detail: program.id });
    return ok({ program }, { status: 201 });
  } catch (error) {
    return serverError("create training programme", error);
  }
}
