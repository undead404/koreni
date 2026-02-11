import type { RequestHandler } from 'express';
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

export const rateLimitMiddleware: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const apiKey = request.headers['x-api-key'] as string | undefined;
    const isApiAuthenticated = !!apiKey;

    if (isApiAuthenticated && apiKey) {
      // Use API key as identifier for API requests
      await rateLimiterApiKey.consume(apiKey);
    } else {
      // Use IP for web requests (stricter limit)
      const ip =
        (request.headers['x-forwarded-for'] as string) ||
        request.socket.remoteAddress ||
        'unknown';
      await rateLimiterIp.consume(ip);
    }

    next();
  } catch {
    return response.status(429).json({
      error: 'Too many requests. Please try again later.',
    });
  }
};
