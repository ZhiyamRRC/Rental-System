type Bucket = { count: number; resetAt: number };

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __crRateLimits?: Map<string, Bucket>;
};

const buckets = globalForRateLimit.__crRateLimits ?? new Map<string, Bucket>();
if (process.env.NODE_ENV !== "production") globalForRateLimit.__crRateLimits = buckets;

/**
 * Lightweight per-process limiter. Paired with recordLimitSuccess() so repeated
 * GOOD actions never exhaust the pool — only failures accumulate.
 * For horizontally-scaled deployments, swap the store for Redis.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  const bucket = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + windowMs } : existing;
  buckets.set(key, bucket);
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count += 1;

  if (buckets.size > 5_000) {
    for (const [bucketKey, value] of buckets) if (value.resetAt <= now) buckets.delete(bucketKey);
  }

  return { ok: true, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

/** Give a used slot back after a successful request so legit traffic doesn't lock itself out. */
export function recordLimitSuccess(key: string) {
  const b = buckets.get(key);
  if (b && b.count > 0) b.count -= 1;
}

export function requestIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  // Loopback/proxy origins are shared by every client in sandboxed/previews — treat them as one
  // coarse bucket but never as a per-user jail; the strictest limits key by account instead.
  return fwd || req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
