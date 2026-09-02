import "server-only";
import { createHash, randomInt, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Short-lived OTP and password-reset challenges.
 *
 * Held in memory with a hard expiry and an attempt cap. Codes and tokens are
 * stored hashed, so a memory dump does not hand over a working credential.
 * A production deployment swaps this for Redis plus a real SMS/email provider —
 * the interface is the same three functions.
 */

interface Challenge {
  hash: string;
  expiresAt: number;
  attempts: number;
  /** Opaque subject: user id for resets, normalised mobile for OTP. */
  subject: string;
}

const globalChallenges = globalThis as unknown as { __lincodeChallenges?: Map<string, Challenge> };
const store: Map<string, Challenge> = (globalChallenges.__lincodeChallenges ??= new Map());

const OTP_TTL_MS = 5 * 60_000;
const RESET_TTL_MS = 30 * 60_000;
const MAX_ATTEMPTS = 5;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function prune(): void {
  const now = Date.now();
  for (const [key, challenge] of store) if (challenge.expiresAt <= now) store.delete(key);
}

export function issueOtp(mobile: string): string {
  prune();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  store.set(`otp:${mobile}`, { hash: hash(code), expiresAt: Date.now() + OTP_TTL_MS, attempts: 0, subject: mobile });

  // Stands in for the SMS gateway. The code is never returned to the client.
  console.info(`[lincode][otp] code for ${mobile}: ${code} (valid ${OTP_TTL_MS / 60_000} minutes)`);
  return code;
}

export function verifyOtp(mobile: string, code: string): boolean {
  prune();
  const key = `otp:${mobile}`;
  const challenge = store.get(key);
  if (!challenge || challenge.expiresAt <= Date.now()) return false;

  challenge.attempts += 1;
  if (challenge.attempts > MAX_ATTEMPTS) {
    store.delete(key);
    return false;
  }

  const expected = Buffer.from(challenge.hash, "hex");
  const actual = Buffer.from(hash(code), "hex");
  const match = expected.length === actual.length && timingSafeEqual(expected, actual);
  if (match) store.delete(key);
  return match;
}

export function issueResetToken(userId: string): string {
  prune();
  const token = randomBytes(32).toString("base64url");
  store.set(`reset:${hash(token)}`, {
    hash: hash(token), expiresAt: Date.now() + RESET_TTL_MS, attempts: 0, subject: userId,
  });

  // Stands in for the transactional email. Never surfaced in an HTTP response.
  console.info(`[lincode][reset] token for ${userId}: ${token} (valid ${RESET_TTL_MS / 60_000} minutes)`);
  return token;
}

export function consumeResetToken(token: string): string | null {
  prune();
  const key = `reset:${hash(token)}`;
  const challenge = store.get(key);
  if (!challenge || challenge.expiresAt <= Date.now()) return null;
  store.delete(key);
  return challenge.subject;
}
