import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { fieldErrors } from "@/lib/auth/validation";
import { consumeWithSweep, clientKey, type RateLimitRule } from "@/lib/auth/rate-limit";
import { verifyOrigin } from "@/lib/auth/guard";

/**
 * Shared plumbing for route handlers: uniform envelopes, body-size limits,
 * validation, origin checks and rate limiting — applied the same way
 * everywhere so no endpoint quietly skips one.
 */

const MAX_BODY_BYTES = 64 * 1024;

export function ok<T extends object>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Never echo internals to the client; log the detail server-side instead. */
export function serverError(context: string, error: unknown) {
  console.error(`[lincode] ${context}:`, error);
  return fail("Something went wrong. Please try again.", 500);
}

export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<
  { ok: true; data: T } | { ok: false; response: NextResponse }
> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return { ok: false, response: fail("Request body is too large.", 413) };
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: fail("Expected a JSON body.", 400) };
  }

  try {
    return { ok: true, data: schema.parse(raw) };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, response: fail("Please correct the highlighted fields.", 422, { fields: fieldErrors(error) }) };
    }
    throw error;
  }
}

export function rateLimit(request: Request, bucket: string, rule: RateLimitRule): NextResponse | null {
  const result = consumeWithSweep(clientKey(request.headers, bucket), rule);
  if (result.allowed) return null;
  return NextResponse.json(
    { ok: false, error: "Too many attempts. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
  );
}

/** Reject cross-site state-changing requests before any work happens. */
export async function requireSameOrigin(): Promise<NextResponse | null> {
  return (await verifyOrigin()) ? null : fail("Request blocked.", 403);
}
