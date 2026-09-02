import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { applySchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { createApplication, getOpportunity, hasApplied } from "@/lib/data/opportunities";
import { buildEngineContext } from "@/lib/services/student";
import { getSkillEngine } from "@/lib/ai";
import { audit, pushNotification } from "@/lib/data/users";
import { getPortfolio } from "@/lib/data/portfolio";

export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "apply", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, applySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const opportunity = await getOpportunity(parsed.data.opportunityId);
    if (!opportunity || opportunity.status !== "open") return fail("That opportunity is no longer open.", 404);
    if (new Date(opportunity.deadline).getTime() < Date.now()) return fail("Applications for this role have closed.", 410);
    if (await hasApplied(auth.user.id, opportunity.id)) return fail("You have already applied to this.", 409);

    const ctx = await buildEngineContext(auth.user.id);
    if (!ctx) return fail("Complete your profile before applying.", 400);

    const match = getSkillEngine().matchOpportunity(opportunity, ctx);
    if (!match.eligible) {
      // Eligibility is re-checked here, not just rendered in the UI — a student
      // cannot bypass it by posting the id directly.
      await audit({ userId: auth.user.id, action: "application.create", outcome: "denied", detail: opportunity.id });
      return fail(`You are not eligible for this opportunity. ${match.ineligibleReasons.join(" ")}`, 403);
    }

    // Attach the student's current resume, if they have one. The recruiter's
    // access to it is derived from this link and checked on every read.
    const portfolio = await getPortfolio(auth.user.id);
    const resume = portfolio.documents.find((d) => d.kind === "resume");

    const application = await createApplication({
      opportunityId: opportunity.id,
      studentId: auth.user.id,
      matchScore: match.matchScore,
      coverNote: parsed.data.coverNote,
      resumeDocumentId: resume?.id,
    });

    await pushNotification({
      userId: opportunity.postedByUserId,
      title: "New application",
      body: `${auth.user.name} applied to ${opportunity.title} with a ${match.matchScore}% skill match.`,
      kind: "info",
      href: "/industry/applicants",
    });
    await audit({ userId: auth.user.id, action: "application.create", outcome: "success", detail: opportunity.id });

    return ok({ application }, { status: 201 });
  } catch (error) {
    return serverError("apply", error);
  }
}
