import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Role } from "@/lib/types";

/**
 * Stateless session tokens.
 *
 * The cookie is httpOnly + SameSite=Lax + Secure in production, so it is
 * unreadable from JavaScript and not sent on cross-site POSTs. The payload
 * carries only identifiers and role grants — never a password hash, never PII
 * beyond the display name.
 *
 * This module is edge-safe (jose, no node:crypto) so `middleware.ts` can verify
 * a session before a request ever reaches a route handler.
 */

export const SESSION_COOKIE = "sb_session";
const DEFAULT_TTL_SECONDS = 60 * 60 * 8; // 8h
const REMEMBERED_TTL_SECONDS = 60 * 60 * 24 * 30; // 30d

export interface SessionPayload extends JWTPayload {
  sub: string;
  name: string;
  roles: Role[];
  activeRole: Role | null;
  onboardingComplete: boolean;
}

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    if (process.env.NODE_ENV === "production") {
      // Fail closed: a weak signing key in production is a full auth bypass.
      throw new Error("SESSION_SECRET must be set to at least 32 characters in production.");
    }
    // Development fallback only — never used when NODE_ENV=production.
    return new TextEncoder().encode("skillbridge-development-only-secret-key-please-set-SESSION_SECRET");
  }
  return new TextEncoder().encode(value);
}

export function sessionTtl(remember: boolean): number {
  return remember ? REMEMBERED_TTL_SECONDS : DEFAULT_TTL_SECONDS;
}

export async function createSessionToken(
  payload: Omit<SessionPayload, "iat" | "exp">,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer("skillbridge")
    .setAudience("skillbridge-app")
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "skillbridge",
      audience: "skillbridge-app",
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string") return null;
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(ttlSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttlSeconds,
  };
}
