import { OAuth2Client } from 'google-auth-library';
import type { Context } from 'hono';
import { setCookie } from 'hono/cookie';
import { sign } from 'hono/jwt';

import createUser from '../database/create-user.js';
import findUser from '../database/find-user-by-google-id.js';
import environment from '../environment.js';
import generateId from '../helpers/generate-id.js';
import { authSchema, Jwt } from '../schemata.js';
const TOKEN_EXPIRATION_IN_SECONDS = 3600 * 24; // 1 day

const client = new OAuth2Client(environment.OAUTH_CLIENT_ID);

const handleTranscribeGoogleAuth = async (c: Context) => {
  const body = (await c.req.json()) as unknown;
  const data = authSchema.parse(body);
  const oauthToken = data.credential;

  if (!oauthToken) {
    return c.json({ error: 'Missing credential' }, 400);
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: oauthToken,
      audience: environment.OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid payload');

    const { email, sub: googleId } = payload;

    const user = await findUser(googleId);
    let userId = user?.id;

    if (!userId) {
      if (!email) {
        return c.json({ error: 'Missing email' }, 400);
      }
      userId = generateId();
      await createUser({ email, googleId, id: userId });
    }
    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      {
        sub: userId,
        iat: now,
        isAdmin: !!user?.is_admin,
        exp: now + TOKEN_EXPIRATION_IN_SECONDS,
      } satisfies Jwt,
      environment.JWT_SECRET,
    );

    setCookie(c, 'auth_session', token, {
      httpOnly: true,
      secure: environment.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: TOKEN_EXPIRATION_IN_SECONDS,
      path: '/',
    });

    return c.json({ success: true, user: { email } });
  } catch {
    return c.json({ error: 'Token verification failed' }, 401);
  }
};

export default handleTranscribeGoogleAuth;
