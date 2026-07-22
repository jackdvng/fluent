import { Redis } from "@upstash/redis";

/**
 * Server-side license validation used to gate Pro-only content (e.g. the
 * vocabulary "depth" fields). Results are cached in Upstash Redis so we don't
 * call Lemon Squeezy on every lesson generation.
 *
 * If Redis isn't configured, validation still works — it just isn't cached.
 * If Lemon Squeezy isn't configured/reachable, keys are treated as invalid
 * (free tier), so paid features fail closed.
 */

const CACHE_PREFIX = "fluent-license:";
const VALID_TTL_SECONDS = 60 * 60 * 24; // 24h
const INVALID_TTL_SECONDS = 60 * 60; // 1h

let cachedRedis: Redis | null = null;
let redisInitialized = false;

function getRedis(): Redis | null {
  if (redisInitialized) {
    return cachedRedis;
  }
  redisInitialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  cachedRedis = url && token ? new Redis({ url, token }) : null;
  return cachedRedis;
}

async function callLemonSqueezy(licenseKey: string): Promise<boolean> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(
      "https://api.lemonsqueezy.com/v1/licenses/validate",
      {
        method: "POST",
        headers,
        body: new URLSearchParams({ license_key: licenseKey }).toString(),
      },
    );

    const data = (await response.json().catch(() => null)) as {
      valid?: boolean;
    } | null;

    return Boolean(data?.valid);
  } catch (error) {
    console.error("[license] Lemon Squeezy validation failed:", error);
    return false;
  }
}

/**
 * Returns true when the license key is valid (Pro). Cached in Redis.
 */
export async function isProLicense(
  licenseKey: string | undefined | null,
): Promise<boolean> {
  const key = licenseKey?.trim();
  if (!key) {
    return false;
  }

  const redis = getRedis();
  const cacheKey = `${CACHE_PREFIX}${key}`;

  if (redis) {
    try {
      const cached = await redis.get<string>(cacheKey);
      if (cached === "valid") {
        return true;
      }
      if (cached === "invalid") {
        return false;
      }
    } catch (error) {
      console.error("[license] Redis read failed:", error);
    }
  }

  const valid = await callLemonSqueezy(key);

  if (redis) {
    try {
      await redis.set(cacheKey, valid ? "valid" : "invalid", {
        ex: valid ? VALID_TTL_SECONDS : INVALID_TTL_SECONDS,
      });
    } catch (error) {
      console.error("[license] Redis write failed:", error);
    }
  }

  return valid;
}
