import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';

import verifyToken from '../helpers/verify-token.js';
import type { ContextVariables } from '../types.js';

export const transcribeAuthMiddleware = createMiddleware<{
  Variables: ContextVariables;
}>(async (c, next) => {
  // if (environment.NODE_ENV === 'development') {
  //   return next();
  // }
  const token = getCookie(c, 'auth_session');

  if (!token) {
    return c.json({ user: null }, 401);
  }

  try {
    const payload = await verifyToken(token);
    c.set('userId', payload.sub);
    c.set('isAdmin', payload.isAdmin);
    await next();
  } catch {
    return c.json({ user: null }, 401);
  }
});
