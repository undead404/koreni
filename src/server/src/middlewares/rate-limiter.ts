import { getConnInfo } from '@hono/node-server/conninfo';
import type { MiddlewareHandler } from 'hono';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiterIp = new RateLimiterMemory({
  points: 10,
  duration: 60 * 60,
});

const rateLimiterApiKey = new RateLimiterMemory({
  points: 10,
  duration: 60 * 60,
});

export const rateLimitMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    const apiKey = c.req.header('x-api-key');
    const isApiAuthenticated = !!apiKey;

    if (isApiAuthenticated && apiKey) {
      await rateLimiterApiKey.consume(apiKey);
    } else {
      const connInfo = getConnInfo(c);
      const ip =
        c.req.header('x-forwarded-for') || connInfo.remote.address || 'unknown';
      await rateLimiterIp.consume(ip);
    }

    await next();
  } catch {
    return c.json({ error: 'Too many requests. Please try again later.' }, 429);
  }
};
