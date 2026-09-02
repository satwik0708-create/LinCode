import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { advanceApplicationSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { advanceApplication, getApplication, getOpportunity } from "@/lib/data/opportunities";
import { audit, pushNotification } from "@/lib/data/users";

const STAGE_COPY: Record<string, string> = {
  under_review: "is now under review",
  shortlisted: "has been shortlisted",
  interview: "has moved to the interview stage",
  selected: "has been selected",
  rejected: "was not taken forward this time",
};

/** Recruiter-only. Ownership of the underlying posting is verified server-side. */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "advance", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("industry");
  if (!auth.ok) return fail(auth.message, auth.status);
  if (!auth.user.organizationId) return fail("Complete your organisation profile first.", 400);

  const parsed = await readJson(request, advanceApplicationSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const updated = await advanceApplication(
      parsed.data.applicationId,
      parsed.data.stage,
      auth.user.id,
      auth.user.organizationId,
      parsed.data.note,
    );

    if (!updated) {
      await audit({ userId: auth.user.id, action: "application.advance", outcome: "denied", detail: parsed.data.applicationId });
      return fail("You do not have access to that application.", 403);
    }

    const application = await getApplication(updated.id);
    const opportunity = application ? await getOpportunity(application.opportunityId) : undefined;
    if (application && opportunity) {
      await pushNotification({
        userId: application.studentId,
        title: `Update: ${opportunity.title}`,
        body: `Your application ${STAGE_COPY[parsed.data.stage] ?? "was updated"}.`,
        kind: parsed.data.stage === "rejected" ? "warning" : "action",
        href: "/student/applications",
      });
    }

    await audit({ userId: auth.user.id, action: "application.advance", outcome: "success", detail: `${updated.id}:${parsed.data.stage}` });
    return ok({ application: updated });
  } catch (error) {
    return serverError("advance application", error);
  }
}
