import { deleteCookie, getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';

import environment from '../environment.js';
import verifyToken from '../helpers/verify-token.js';
import type { ContextVariables } from '../types.js';

export const transcribeAuthMiddleware = createMiddleware<{
  Variables: ContextVariables;
}>(async (c, next) => {
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
    deleteCookie(c, 'auth_session', {
      path: '/',
      secure: environment.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    c.header('Cache-Control', 'no-store, max-age=0');
    return c.json({ user: null }, 401);
  }
});
