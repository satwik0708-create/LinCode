import { ok, fail, readJson, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { addCertificationSchema } from "@/lib/auth/validation";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { addCertification, getPortfolio } from "@/lib/data/portfolio";
import { audit, pushNotification } from "@/lib/data/users";
import { getSkill } from "@/lib/domain/skills";
import { read } from "@/lib/data/store";

/**
 * Add a certification to the signed-in student's portfolio.
 *
 * An attached document must already belong to them — a document id from
 * somebody else's upload is rejected rather than quietly dropped, so a claim
 * can never point at evidence its owner cannot see.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "add-certification", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize("student");
  if (!auth.ok) return fail(auth.message, auth.status);

  const parsed = await readJson(request, addCertificationSchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;

  try {
    const unknown = data.skillIds.filter((id) => !getSkill(id));
    if (unknown.length) {
      return fail("Some selected skills are not recognised.", 422, { fields: { skillIds: unknown.join(", ") } });
    }

    if (data.documentId) {
      const { documents } = await getPortfolio(auth.user.id);
      if (!documents.some((d) => d.id === data.documentId)) {
        return fail("That certificate upload could not be found.", 422, { fields: { documentId: "Re-upload the certificate." } });
      }
    }

    const certification = await addCertification({
      userId: auth.user.id,
      name: data.name,
      issuer: data.issuer,
      issuedOn: new Date(data.issuedOn).toISOString(),
      credentialId: data.credentialId || undefined,
      credentialUrl: data.credentialUrl || undefined,
      skillIds: data.skillIds,
      documentId: data.documentId,
    });

    // Tell the institution there is something waiting, but only when there is.
    if (certification.verificationStatus === "pending" && auth.user.institutionId) {
      const db = await read();
      const reviewers = db.users.filter(
        (u) => u.institutionId === auth.user.institutionId && u.roles.includes("institution"),
      );
      await Promise.all(
        reviewers.map((reviewer) =>
          pushNotification({
            userId: reviewer.id,
            title: "Certificate awaiting verification",
            body: `${auth.user.name} submitted ${certification.name} for review.`,
            kind: "info",
            href: "/institution/verifications",
          }),
        ),
      );
    }

    await audit({ userId: auth.user.id, action: "certification.add", outcome: "success", detail: certification.id });
    return ok({ certification }, { status: 201 });
  } catch (error) {
    return serverError("add certification", error);
  }
}
