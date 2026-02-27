import { getConnInfo } from '@hono/node-server/conninfo';
import { Context, Next } from 'hono';

import environment from '../environment.js';
import getClientIdentifier from '../helpers/get-client-identifier.js';
import isValidApiKey from '../helpers/is-valid-api-key.js';
import { turnstilePayloadSchema } from '../schemata.js';
import posthog from '../services/posthog.js';
import validateTurnstile from '../services/validate-turnstile.js';

export const authMiddleware = async (c: Context, next: Next) => {
  // Extract API key from header
  const apiKey = c.req.header('x-api-key');
  const info = getConnInfo(c);
  const ip = (c.req.header('x-forwarded-for') as string) || info.remote.address;
  const clientId = getClientIdentifier(c, apiKey);
  const isApiKeyAuth = isValidApiKey(apiKey);

  const body = (await c.req.parseBody()) as unknown;
  const parseResult = turnstilePayloadSchema.parse(body);
  if (!isApiKeyAuth && environment.NODE_ENV === 'production') {
    const token = parseResult.turnstileToken;

    if (!token) {
      posthog.capture({
        distinctId: clientId,
        event: 'turnstile_token_missing',
        properties: {
          ip,
        },
      });
      return c.json({ error: 'Captcha token is required' }, 400);
    }

    const turnstileValidationResult = await validateTurnstile(
      ip as string,
      token,
    );
    if (!turnstileValidationResult.success) {
      posthog.capture({
        distinctId: clientId,
        event: 'turnstile_validation_failed',
        properties: {
          ip,
          reason: turnstileValidationResult['error-codes'] || [],
        },
      });
      return c.json({ error: 'Captcha validation failed' }, 403);
    }
  }
  await next();
};
