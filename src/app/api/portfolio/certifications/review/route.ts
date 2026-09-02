import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { reviewCertificationSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { reviewCertification } from "@/lib/data/portfolio";
import { audit, pushNotification } from "@/lib/data/users";

/**
 * Verify or reject a student's certification claim.
 *
 * Only the institution the student is enrolled at may rule on it; the check
 * lives in the repository, so this route cannot widen it by passing a different
 * institution id — there is none to pass.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "review-certification", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("institution");
  if (!auth.ok) return fail(auth.message, auth.status);
  if (!auth.user.institutionId) return fail("Complete your institution profile first.", 400);

  const parsed = await readJson(request, reviewCertificationSchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;

  try {
    const certification = await reviewCertification({
      certificationId: data.certificationId,
      reviewerId: auth.user.id,
      reviewerInstitutionId: auth.user.institutionId,
      approve: data.approve,
      note: data.note,
    });

    if (!certification) {
      await audit({ userId: auth.user.id, action: "certification.review", outcome: "denied", detail: data.certificationId });
      // Same answer for "already reviewed" and "not your student", so the
      // endpoint cannot be used to enumerate other institutions' claims.
      return fail("That claim is not awaiting your review.", 404);
    }

    await pushNotification({
      userId: certification.userId,
      title: data.approve ? "Certificate verified" : "Certificate not verified",
      body: data.approve
        ? `${certification.name} is now verified on your portfolio.`
        : `${certification.name} was not verified.${data.note ? ` ${data.note}` : ""}`,
      kind: data.approve ? "success" : "warning",
      href: "/student/portfolio",
    });

    await audit({ userId: auth.user.id, action: "certification.review", outcome: "success", detail: certification.id });
    return ok({ certification });
  } catch (error) {
    return serverError("review certification", error);
  }
}
