import { deleteCookie } from 'hono/cookie';

import revokeUserSessions from '../database/revoke-user-sessions.js';
// Replace with your actual session store/database interface
import environment from '../environment.js';
import type { TranscribeContext } from '../types.js';

const handleTranscribeAuthSessionDelete = async (c: TranscribeContext) => {
  await revokeUserSessions(c.var.userId);

  deleteCookie(c, 'auth_session', {
    path: '/',
    secure: environment.NODE_ENV === 'production',
    sameSite: 'Strict',
  });

  c.header('Cache-Control', 'no-store, max-age=0');

  return c.body(null, 204);
};

export default handleTranscribeAuthSessionDelete;
