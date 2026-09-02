import { fail } from "@/lib/api";
import { authorize } from "@/lib/auth/guard";
import { canReadDocument } from "@/lib/data/portfolio";
import { readUpload } from "@/lib/data/uploads";
import { audit } from "@/lib/data/users";

/**
 * Serve a document's bytes.
 *
 * Runs exactly the same authorisation as the descriptor route — the bytes are
 * never reachable by a path that skips `canReadDocument`. Content-Disposition
 * is `inline` with a generated filename and `X-Content-Type-Options: nosniff`,
 * so an uploaded file cannot be coaxed into executing as something else.
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
    await audit({ userId: auth.user.id, action: "document.read", outcome: "denied", detail: documentId });
    return fail("Document not found.", 404);
  }

  const bytes = await readUpload(verdict.document.storageKey);
  if (!bytes) {
    // Seeded fixtures carry metadata without a file behind it.
    return fail("This document has no stored file.", 404);
  }

  await audit({ userId: auth.user.id, action: "document.read", outcome: "success", detail: documentId });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": verdict.document.mimeType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `inline; filename="${verdict.document.id}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store, private",
    },
  });
}
