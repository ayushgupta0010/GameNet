// Minimal in-memory rate limiter keyed by client IP. Good enough for a
// single long-running Node process (`next start`); on serverless deploys
// each instance tracks its own counts, which loosens the limit but never
// breaks functionality. Swap for a shared store (e.g. Upstash Redis) if you
// need a hard global limit.

const buckets = new Map();

/**
 * @param {Request} request
 * @param {{ windowMs: number, max: number, bucket: string }} options
 * @returns {{ ok: boolean, retryAfterSeconds?: number }}
 */
export function rateLimit(request, { windowMs, max, bucket }) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();

  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= max) {
    return { ok: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}
