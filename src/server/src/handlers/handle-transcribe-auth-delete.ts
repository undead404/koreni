import type { Context } from 'hono';
import { deleteCookie } from 'hono/cookie';

import environment from '../environment.js';

const handleTranscribeAuthDelete = (c: Context) => {
  deleteCookie(c, 'auth_session', {
    path: '/',
    secure: environment.NODE_ENV === 'production',
    sameSite: 'Lax',
  });

  return Promise.resolve(c.json({ success: true }));
};

export default handleTranscribeAuthDelete;
