import { z } from 'zod';

import findUserById from '../database/find-user-by-id.js';
import { executeUserAccountLink } from '../services/karma-link-flow.js';
import { NavigatorClientError } from '../services/navigator-client.js';
import type { TranscribeContext } from '../types.js';

const karmaLinkRequestSchema = z.object({
  code: z.string().min(1),
});

export default async function handleKarmaLink(c: TranscribeContext) {
  const userId = c.var.userId;
  if (!userId) {
    return c.json({ user: null }, 401);
  }

  const user = await findUserById(userId);
  if (!user || !user.email) {
    return c.json({ user: null }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_request' }, 400);
  }

  const parseResult = karmaLinkRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: 'invalid_request' }, 400);
  }

  const { code } = parseResult.data;

  try {
    const result = await executeUserAccountLink({
      code,
      contributionEmail: user.contribution_email,
      email: user.email,
      userId: user.id,
    });

    return c.json({ awarded: result.awarded, ok: true }, 200);
  } catch (error) {
    if (error instanceof NavigatorClientError) {
      if (error.statusCode === 404) {
        return c.json({ error: error.errorCode || error.message }, 404);
      }
      if (error.statusCode === 409) {
        return c.json({ error: error.errorCode || error.message }, 409);
      }
      if (error.statusCode === 400) {
        return c.json({ error: error.errorCode || error.message }, 400);
      }
      return c.json({ error: error.errorCode || error.message }, 502);
    }

    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    return c.json({ error: message }, 500);
  }
}
