import type { Context } from 'hono';
import { deleteCookie } from 'hono/cookie';

// eslint-disable-next-line @typescript-eslint/require-await
const handleTranscribeAuthDelete = async (c: Context) => {
  deleteCookie(c, 'auth_session', {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  });

  return c.json({ success: true });
};

export default handleTranscribeAuthDelete;
