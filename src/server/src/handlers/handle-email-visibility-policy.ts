import type { Context } from 'hono';

import getEmailVisibilitySuppressions from '../database/get-email-visibility-suppressions.js';
import environment from '../environment.js';
import { logger } from '../logger.js';
import { emailVisibilityPolicyResponseSchema } from '../schemata.js';

export default async function handleEmailVisibilityPolicy(c: Context) {
  c.header('Cache-Control', 'no-store, max-age=0');
  const authorization = c.req.header('authorization');
  if (
    !environment.EMAIL_VISIBILITY_SYNC_TOKEN ||
    authorization !== `Bearer ${environment.EMAIL_VISIBILITY_SYNC_TOKEN}`
  ) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const suppressedEmails = await getEmailVisibilitySuppressions();
  const parsedResponse = emailVisibilityPolicyResponseSchema.safeParse({
    suppressed_emails: suppressedEmails,
  });
  if (!parsedResponse.success) {
    logger.error('account.email_visibility.policy_projection_invalid');
    return c.json({ error: 'Internal Server Error' }, 500);
  }
  return c.json(parsedResponse.data);
}
