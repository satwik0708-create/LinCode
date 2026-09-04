import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "./store";

/**
 * Binary storage for uploaded documents.
 *
 * Files live outside the JSON database under DATA_DIR/uploads, named by an
 * opaque key that has nothing to do with the uploader's filename — the original
 * name is metadata, never a path. Swapping this for an object store means
 * reimplementing these three functions and nothing else.
 */
// Shares the store's resolved directory rather than repeating the rule: two
// copies of "where does data live" is exactly how uploads end up somewhere the
// database is not.
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

/** Every type a student may attach as evidence, and the magic bytes it must start with. */
export const ALLOWED_UPLOAD_TYPES: Record<string, { extension: string; magic: number[][] }> = {
  "application/pdf": { extension: "pdf", magic: [[0x25, 0x50, 0x44, 0x46]] },
  "image/png": { extension: "png", magic: [[0x89, 0x50, 0x4e, 0x47]] },
  "image/jpeg": { extension: "jpg", magic: [[0xff, 0xd8, 0xff]] },
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * A declared content type is a claim by the uploader, so check the bytes too —
 * otherwise "certificate.pdf" could be anything at all.
 */
export function sniffMatchesType(bytes: Uint8Array, mimeType: string): boolean {
  const spec = ALLOWED_UPLOAD_TYPES[mimeType];
  if (!spec) return false;
  return spec.magic.some((signature) => signature.every((byte, i) => bytes[i] === byte));
}

export function newStorageKey(mimeType: string): string {
  const extension = ALLOWED_UPLOAD_TYPES[mimeType]?.extension ?? "bin";
  return `${crypto.randomUUID().replace(/-/g, "")}.${extension}`;
}

/** Reject anything that is not a bare key we generated — no paths, no traversal. */
function resolveKey(storageKey: string): string | null {
  if (!/^[0-9a-f]{32}\.[a-z]{3}$/.test(storageKey)) return null;
  return path.join(UPLOAD_DIR, storageKey);
}

export async function writeUpload(storageKey: string, bytes: Uint8Array): Promise<void> {
  const target = resolveKey(storageKey);
  if (!target) throw new Error("Refusing to write an untrusted storage key.");
  await fs.mkdir(UPLOAD_DIR, { recursive: true, mode: 0o700 });
  await fs.writeFile(target, bytes, { mode: 0o600 });
}

/** Returns null when the key is malformed or the file is gone. */
export async function readUpload(storageKey: string): Promise<Buffer | null> {
  const target = resolveKey(storageKey);
  if (!target) return null;
  try {
    return await fs.readFile(target);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

/** Drop every stored file. Paired with `resetStore`, so a reset leaves nothing orphaned. */
export async function clearUploads(): Promise<void> {
  await fs.rm(UPLOAD_DIR, { recursive: true, force: true });
}
