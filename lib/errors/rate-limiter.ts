// Simple in-memory rate limiter
// For production, consider using Redis or Supabase for persistence

interface RateLimitEntry {
  count: number
  resetAt: number
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>()

  async check(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now()
    const entry = this.limits.get(key)

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      this.cleanup()
    }

    if (!entry || now > entry.resetAt) {
      // New window
      this.limits.set(key, {
        count: 1,
        resetAt: now + (windowSeconds * 1000)
      })
      return { allowed: true, remaining: limit - 1 }
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return { allowed: false, remaining: 0 }
    }

    // Increment count
    entry.count++
    return { allowed: true, remaining: limit - entry.count }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        this.limits.delete(key)
      }
    }
  }
}

export const rateLimiter = new RateLimiter()