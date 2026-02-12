import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

import environment from '../environment';
import validateTurnstile from '../services/validate-turnstile';

export async function authMiddleware(c: Context, next: Next) {
  const apiKey = c.req.header('X-Api-Key');

  // Option 1: API Key
  if (apiKey) {
    if (environment.VALID_API_KEYS.has(apiKey)) {
      return next();
    }
    throw new HTTPException(401, { message: 'Invalid API key' });
  }

  // Option 2: Turnstile
  const turnstileToken = c.req.header('CF-Turnstile-Token'); // or whatever header name you use
  if (!turnstileToken) {
    throw new HTTPException(401, {
      message:
        'Authentication required: provide X-Api-Key or CF-Turnstile-Token',
    });
  }

  const ip =
    c.req.header('X-Forwarded-For') || c.req.header('CF-Connecting-IP') || '';
  const isValid = await validateTurnstile(ip, turnstileToken);

  if (!isValid) {
    throw new HTTPException(401, { message: 'Invalid Turnstile token' });
  }

  return next();
}
