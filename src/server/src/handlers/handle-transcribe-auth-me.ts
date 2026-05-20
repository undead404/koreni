import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';

import findUserById from '../database/find-user-by-id.js';
import verifyToken from '../helpers/verify-token.js';

const handleTranscribeAuthMe = async (c: Context) => {
  const token = getCookie(c, 'auth_session');
  if (!token) return c.json({ user: null }, 401);

  try {
    const payload = await verifyToken(token);
    const user = await findUserById(payload.sub);
    return c.json({ user });
  } catch {
    return c.json({ user: null }, 401);
  }
};

export default handleTranscribeAuthMe;
