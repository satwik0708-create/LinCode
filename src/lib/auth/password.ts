import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * Password hashing with scrypt.
 *
 * Deliberately slow and salted — the point is that a stolen database is not a
 * stolen password list. Parameters are stored inside the hash string so they
 * can be raised later without invalidating existing accounts.
 */
const PARAMS = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize("NFKC"), salt, KEYLEN, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
    if (scheme !== "scrypt") return false;
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const derived = await scrypt(password.normalize("NFKC"), salt, expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
    });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * Burn roughly the same CPU as a real verification when the account does not
 * exist, so response timing cannot be used to enumerate accounts.
 */
export async function fakeVerify(): Promise<void> {
  await scrypt("timing-equalisation", randomBytes(16), KEYLEN, PARAMS);
}

export interface PasswordCheck {
  ok: boolean;
  problems: string[];
  score: 0 | 1 | 2 | 3 | 4;
}

const COMMON = new Set([
  "password", "password1", "12345678", "123456789", "qwerty123", "letmein1",
  "welcome1", "admin123", "iloveyou", "abc12345", "student1", "changeme",
]);

export function checkPasswordStrength(password: string): PasswordCheck {
  const problems: string[] = [];
  if (password.length < 10) problems.push("Use at least 10 characters.");
  if (!/[a-z]/.test(password)) problems.push("Add a lowercase letter.");
  if (!/[A-Z]/.test(password)) problems.push("Add an uppercase letter.");
  if (!/[0-9]/.test(password)) problems.push("Add a number.");
  if (COMMON.has(password.toLowerCase())) problems.push("This password is too common.");

  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  const lengthPoints = password.length >= 16 ? 2 : password.length >= 12 ? 1 : 0;
  const score = Math.min(4, Math.max(0, variety - 1 + lengthPoints)) as PasswordCheck["score"];

  return { ok: problems.length === 0, problems, score };
}
