import { OAuth2Client } from 'google-auth-library';
import type { Context } from 'hono';
import { setCookie } from 'hono/cookie';
import { sign } from 'hono/jwt';

import upsertUser from '../database/upsert-user.js';
import environment from '../environment.js';
import { authSchema, Jwt } from '../schemata.js';

const TOKEN_EXPIRATION_IN_SECONDS = 3600 * 24;
const client = new OAuth2Client(environment.OAUTH_CLIENT_ID);

const handleTranscribeGoogleAuth = async (c: Context) => {
  // 1. Safe boundary for schema validation
  const body: unknown = await c.req.json().catch(() => null);
  const parseResult = authSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json({ error: 'Invalid authentication payload structure' }, 400);
  }

  const oauthToken = parseResult.data.credential;

  try {
    // 2. Identity Verification
    const ticket = await client.verifyIdToken({
      idToken: oauthToken,
      audience: environment.OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      return c.json({ error: 'Malformed Google identity payload' }, 400);
    }

    // 3. Atomic Database Execution (Returns user + token_version)
    const user = await upsertUser({
      googleId: payload.sub,
      email: payload.email,
    });

    const now = Math.floor(Date.now() / 1000);

    // 4. Miniting a Revocable JWT
    const token = await sign(
      {
        sub: user.id,
        iat: now,
        exp: now + TOKEN_EXPIRATION_IN_SECONDS,
        isAdmin: !!user.is_admin,
        v: user.token_version, // Mandatory for global revocation capability
      } satisfies Jwt,
      environment.JWT_SECRET,
    );

    // 5. Hardened Cookie Parameters
    setCookie(c, 'auth_session', token, {
      httpOnly: true,
      secure: environment.NODE_ENV === 'production',
      sameSite: 'Strict', // Upgraded from Lax to prevent top-level CSRF
      maxAge: TOKEN_EXPIRATION_IN_SECONDS,
      path: '/',
    });

    return c.json({ success: true, user: { email: user.email } });
  } catch (error) {
    // 6. Precise Error Segregation
    if (
      error instanceof Error &&
      error.message.includes('Token used too late')
    ) {
      return c.json({ error: 'Google token expired' }, 401);
    }

    // Log the actual error for internal observability, do not leak to client
    console.error('[AUTH_ERROR]', error);
    return c.json({ error: 'Internal authentication failure' }, 500);
  }
};

export default handleTranscribeGoogleAuth;
