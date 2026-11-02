// api/lib/ratelimit.ts
// In-memory sliding-window rate limiter for Vercel serverless functions.
// Note: resets on cold start. For stricter limits use Upstash Redis.

interface Record {
  count: number;
  windowStart: number;
}

const store = new Map<string, Record>();

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  existing.count++;
  return { allowed: true, remaining: maxRequests - existing.count };
}

// Cleanup old entries periodically (called lazily)
let lastClean = Date.now();
export function maybePruneStore(): void {
  const now = Date.now();
  if (now - lastClean < 60_000) return;
  lastClean = now;
  for (const [k, v] of store.entries()) {
    if (now - v.windowStart > 300_000) store.delete(k);
  }
}
