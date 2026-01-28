import redis from './redis';

/**
 * Redis-based rate limiter for email sending
 * Implements a sliding window counter per user per hour
 */
export class RateLimiter {
  private readonly keyPrefix = 'ratelimit:emails';

  /**
   * Check if a user can send an email and increment the counter if allowed
   * @param userId - User identifier
   * @param hourlyLimit - Maximum emails allowed per hour
   * @returns true if email can be sent, false if rate limit exceeded
   */
  async canSendEmail(userId: string, hourlyLimit: number): Promise<boolean> {
    const now = Date.now();
    const currentHour = Math.floor(now / (60 * 60 * 1000));
    const key = `${this.keyPrefix}:${userId}:${currentHour}`;

    const count = await redis.incr(key);
    
    // Set expiry on first increment (2 hours to handle edge cases)
    if (count === 1) {
      await redis.expire(key, 2 * 60 * 60);
    }

    return count <= hourlyLimit;
  }

  /**
   * Get current email count for the current hour
   * @param userId - User identifier
   * @returns number of emails sent in current hour
   */
  async getCurrentCount(userId: string): Promise<number> {
    const now = Date.now();
    const currentHour = Math.floor(now / (60 * 60 * 1000));
    const key = `${this.keyPrefix}:${userId}:${currentHour}`;

    const count = await redis.get(key);
    return count ? parseInt(count) : 0;
  }

  /**
   * Get time until the current hour window resets (in milliseconds)
   * @returns milliseconds until next hour
   */
  getTimeUntilReset(): number {
    const now = Date.now();
    const currentHour = Math.floor(now / (60 * 60 * 1000));
    const nextHour = (currentHour + 1) * 60 * 60 * 1000;
    return nextHour - now;
  }

  /**
   * Reset rate limit for a user (useful for testing)
   * @param userId - User identifier
   */
  async resetLimit(userId: string): Promise<void> {
    const now = Date.now();
    const currentHour = Math.floor(now / (60 * 60 * 1000));
    const key = `${this.keyPrefix}:${userId}:${currentHour}`;
    await redis.del(key);
  }
}

export const rateLimiter = new RateLimiter();
