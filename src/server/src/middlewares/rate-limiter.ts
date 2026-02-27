import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context, Next } from 'hono';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limit per IP: 10 requests per 15 minutes
const rateLimiterIp = new RateLimiterMemory({
  points: 10,
  duration: 60 * 60,
});

// Rate limit per API key: 10 requests per hour (much more generous)
const rateLimiterApiKey = new RateLimiterMemory({
  points: 10,
  duration: 60 * 60,
});

export const rateLimitMiddleware = async (c: Context, next: Next) => {
  try {
    const apiKey = c.req.header('x-api-key');
    const isApiAuthenticated = !!apiKey;

    if (isApiAuthenticated && apiKey) {
      // Use API key as identifier for API requests
      await rateLimiterApiKey.consume(apiKey);
    } else {
      // Use IP for web requests (stricter limit)
      const info = getConnInfo(c);
      const ip =
        (c.req.header('x-forwarded-for') as string) ||
        info.remote.address ||
        'unknown';
      await rateLimiterIp.consume(ip);
    }

    await next();
  } catch {
    return c.json({ error: 'Too many requests. Please try again later.' }, 429);
  }
};
