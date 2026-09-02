/**
 * Fixed-window rate limiter.
 *
 * In-process and therefore per-instance — correct for the MVP's single node,
 * and deliberately behind a narrow interface so swapping in Redis/Upstash later
 * means reimplementing `consume` alone.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const globalLimiter = globalThis as unknown as { __lincodeRateBuckets?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = (globalLimiter.__lincodeRateBuckets ??= new Map());

export interface RateLimitRule {
  /** Requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export const RATE_LIMITS = {
  login: { limit: 8, windowMs: 10 * 60_000 },
  signup: { limit: 5, windowMs: 60 * 60_000 },
  otpRequest: { limit: 5, windowMs: 15 * 60_000 },
  passwordReset: { limit: 5, windowMs: 60 * 60_000 },
  mutation: { limit: 90, windowMs: 60_000 },
  ai: { limit: 30, windowMs: 60_000 },
} satisfies Record<string, RateLimitRule>;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function consume(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true, remaining: rule.limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > rule.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, remaining: rule.limit - bucket.count, retryAfterSeconds: 0 };
}

/** Opportunistically drop expired buckets so the map cannot grow without bound. */
export function sweep(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

let sweepCounter = 0;
export function consumeWithSweep(key: string, rule: RateLimitRule): RateLimitResult {
  if (++sweepCounter % 500 === 0) sweep();
  return consume(key, rule);
}

/** Best-effort client identity for limiting. Never trusted for authorisation. */
export function clientKey(headers: Headers, suffix: string): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip") || "unknown";
  return `${suffix}:${ip}`;
}
