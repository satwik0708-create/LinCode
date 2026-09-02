import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { authorize } from "@/lib/auth/guard";
import { canReadDocument } from "@/lib/data/portfolio";
import { audit } from "@/lib/data/users";

/**
 * Authorised document access.
 *
 * There is no public URL for a stored document. Every read runs the ownership
 * and relationship checks in `canReadDocument`, and a denial is logged. The MVP
 * stores metadata only, so this returns the authorised descriptor rather than
 * bytes; wiring a real object store means streaming from `storageKey` *after*
 * this same check, never before it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;

  const auth = await authorize();
  if (!auth.ok) return fail(auth.message, auth.status);

  const role = auth.user.activeRole ?? auth.user.roles[0];
  if (!role) return fail("No role assigned.", 403);

  const verdict = await canReadDocument(documentId, {
    id: auth.user.id,
    role,
    organizationId: auth.user.organizationId,
    institutionId: auth.user.institutionId,
  });

  if (!verdict.allowed || !verdict.document) {
    await audit({
      userId: auth.user.id, action: "document.read", outcome: "denied", detail: documentId,
    });
    // Same response for "does not exist" and "not yours", so the endpoint
    // cannot be used to probe which document ids are real.
    return fail("Document not found.", 404);
  }

  await audit({ userId: auth.user.id, action: "document.read", outcome: "success", detail: documentId });

  return NextResponse.json(
    {
      ok: true,
      document: {
        id: verdict.document.id,
        filename: verdict.document.filename,
        kind: verdict.document.kind,
        mimeType: verdict.document.mimeType,
        sizeBytes: verdict.document.sizeBytes,
        uploadedAt: verdict.document.uploadedAt,
      },
    },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
