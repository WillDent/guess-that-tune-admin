// Simple in-memory rate limiter for API endpoints

const rateLimitStore = new Map<string, { count: number; expires: number }>()

/**
 * Returns true if allowed, false if rate limit exceeded.
 * @param key Unique key (e.g., IP or user ID)
 * @param limit Max requests per window
 * @param windowMs Window size in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  if (!entry || entry.expires < now) {
    // New window
    rateLimitStore.set(key, { count: 1, expires: now + windowMs })
    return true
  }
  if (entry.count < limit) {
    entry.count++
    return true
  }
  return false
}

/**
 * For testing: clear all rate limit data.
 */
export function clearRateLimitStore() {
  rateLimitStore.clear()
} 