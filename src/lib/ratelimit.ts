import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * IP-based rate limiting for the lesson-generation route.
 *
 * Uses Upstash Redis (free tier) with a sliding window of 5 requests/hour/IP.
 * If the Upstash env vars are not configured (e.g. local dev), limiting is
 * disabled and all requests are allowed — the app keeps working without Redis.
 */

const LIMIT = 5;
const WINDOW = "1 h" as const;

let cachedLimiter: Ratelimit | null = null;
let initialized = false;

function getLimiter(): Ratelimit | null {
  if (initialized) {
    return cachedLimiter;
  }
  initialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[ratelimit] Upstash env vars not set — rate limiting is disabled.",
    );
    cachedLimiter = null;
    return null;
  }

  cachedLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(LIMIT, WINDOW),
    prefix: "fluent-ratelimit",
    analytics: false,
  });

  return cachedLimiter;
}

/**
 * Extract the client IP from request headers. On Vercel the real client IP is
 * the first entry of `x-forwarded-for`.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check (and consume) the rate limit for a given IP. Returns success=true when
 * limiting is disabled or the request is within the limit.
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getLimiter();

  if (!limiter) {
    return { success: true, limit: LIMIT, remaining: LIMIT, reset: 0 };
  }

  try {
    const result = await limiter.limit(ip);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // If Redis is unreachable, fail open so a Redis outage doesn't take the
    // whole feature down.
    console.error("[ratelimit] Limiter error — failing open:", error);
    return { success: true, limit: LIMIT, remaining: LIMIT, reset: 0 };
  }
}
