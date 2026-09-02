import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { postOpportunitySchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { createOpportunity } from "@/lib/data/opportunities";
import { audit } from "@/lib/data/users";
import { getSkill } from "@/lib/domain/skills";

/**
 * Post an internship, job, project or apprenticeship.
 *
 * The organisation is taken from the authenticated recruiter's account, never
 * from the request body, so nobody can post under another employer's name.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "post-opportunity", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("industry");
  if (!auth.ok) return fail(auth.message, auth.status);
  if (!auth.user.organizationId) return fail("Complete your organisation profile first.", 400);

  const parsed = await readJson(request, postOpportunitySchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;

  try {
    const unknown = data.skillIds.filter((id) => !getSkill(id));
    if (unknown.length) {
      return fail("Some selected skills are not recognised.", 422, { fields: { skillIds: unknown.join(", ") } });
    }

    const mandatory = new Set(data.mandatorySkillIds);
    const opportunity = await createOpportunity({
      type: data.type,
      organizationId: auth.user.organizationId,
      postedByUserId: auth.user.id,
      title: data.title,
      description: data.description,
      location: data.location,
      workMode: data.workMode,
      stipend: data.stipend || undefined,
      salaryLpa: data.salaryLpa || undefined,
      durationMonths: data.durationMonths,
      domainIds: data.domainIds,
      requirements: data.skillIds.map((skillId) => ({
        skillId,
        minimumScore: mandatory.has(skillId) ? 60 : 45,
        weight: mandatory.has(skillId) ? 2 : 1,
        mandatory: mandatory.has(skillId),
      })),
      eligibility: {
        degrees: data.degrees,
        branches: data.branches,
        graduationYears: data.graduationYears,
        minCgpa: data.minCgpa,
      },
      openings: data.openings,
      deadline: new Date(data.deadline).toISOString(),
      status: "open",
    });

    await audit({ userId: auth.user.id, action: "opportunity.create", outcome: "success", detail: opportunity.id });
    return ok({ opportunity }, { status: 201 });
  } catch (error) {
    return serverError("create opportunity", error);
  }
}
