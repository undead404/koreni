import { randomUUID } from 'node:crypto';

import type { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';

import { logger } from '../logger.js';
import type { ContextVariables } from '../types.js';

const REQUEST_ID_PATTERN = /^[\w.:-]{1,128}$/;

export const requestLoggingMiddleware = createMiddleware<{
  Variables: Pick<ContextVariables, 'requestId'>;
}>(async (c: Context, next: Next) => {
  const incomingRequestId = c.req.header('X-Request-Id');
  const candidate = incomingRequestId?.trim();
  const requestId =
    candidate && REQUEST_ID_PATTERN.test(candidate) ? candidate : randomUUID();
  const startedAt = Date.now();
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);

  try {
    await next();
  } catch (error) {
    logger.error('request.failed', {
      requestId,
      method: c.req.method,
      path: c.req.path,
      durationMs: Date.now() - startedAt,
      error,
    });
    throw error;
  } finally {
    logger.info('request.completed', {
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Date.now() - startedAt,
    });
  }
});
