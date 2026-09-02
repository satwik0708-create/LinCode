import { ok, fail, rateLimit, requireSameOrigin, serverError } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/auth/rate-limit";
import { authorize } from "@/lib/auth/guard";
import { registerDocument } from "@/lib/data/portfolio";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, newStorageKey, sniffMatchesType, writeUpload } from "@/lib/data/uploads";
import { audit } from "@/lib/data/users";
import type { SecureDocument } from "@/lib/types";

const KINDS: SecureDocument["kind"][] = [
  "resume", "certificate", "internship_report", "academic_record", "offer_letter",
];

/** Filenames are metadata shown back to the owner, never a path — keep them tame. */
function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "upload";
  return base.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "upload";
}

/**
 * Upload a document.
 *
 * Three things gate what lands on disk: the declared content type must be on
 * the allow-list, the leading bytes must actually match that type, and the file
 * must be under the size cap. The stored name is generated, so nothing the
 * uploader controls reaches the filesystem.
 */
export async function POST(request: Request) {
  const blocked = await requireSameOrigin();
  if (blocked) return blocked;
  const limited = rateLimit(request, "document-upload", RATE_LIMITS.mutation);
  if (limited) return limited;

  const auth = await authorize();
  if (!auth.ok) return fail(auth.message, auth.status);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Expected a file upload.", 400);
  }

  const file = form.get("file");
  const kind = String(form.get("kind") ?? "certificate") as SecureDocument["kind"];
  if (!(file instanceof File)) return fail("No file was attached.", 400, { fields: { file: "Choose a file." } });
  if (!KINDS.includes(kind)) return fail("Unknown document kind.", 422);

  if (file.size === 0) return fail("That file is empty.", 422, { fields: { file: "That file is empty." } });
  if (file.size > MAX_UPLOAD_BYTES) {
    return fail(`Files must be under ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`, 413, {
      fields: { file: "Too large." },
    });
  }
  if (!ALLOWED_UPLOAD_TYPES[file.type]) {
    return fail("Upload a PDF, PNG or JPEG.", 415, { fields: { file: "Unsupported file type." } });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    // The declared type is the uploader's claim; the bytes are the evidence.
    if (!sniffMatchesType(bytes, file.type)) {
      await audit({ userId: auth.user.id, action: "document.upload", outcome: "denied", detail: file.type });
      return fail("That file's contents do not match its type.", 415, { fields: { file: "Unsupported file type." } });
    }

    const storageKey = newStorageKey(file.type);
    await writeUpload(storageKey, bytes);
    const document = await registerDocument({
      ownerId: auth.user.id,
      kind,
      filename: safeFilename(file.name),
      mimeType: file.type,
      sizeBytes: bytes.byteLength,
      storageKey,
    });

    await audit({ userId: auth.user.id, action: "document.upload", outcome: "success", detail: document.id });
    return ok({ document: { id: document.id, filename: document.filename, sizeBytes: document.sizeBytes } }, { status: 201 });
  } catch (error) {
    return serverError("document upload", error);
  }
}
