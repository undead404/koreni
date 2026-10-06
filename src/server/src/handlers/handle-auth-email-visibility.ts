import findUserById from '../database/find-user-by-id.js';
import updateUserEmailVisibility from '../database/update-user-email-visibility.js';
import { logger } from '../logger.js';
import { emailVisibilitySchema } from '../schemata.js';
import dispatchGithubWorkflow from '../services/github-workflow-dispatch.js';
import type { TranscribeContext } from '../types.js';

export async function handleGetAuthEmailVisibility(c: TranscribeContext) {
  c.header('Cache-Control', 'no-store, max-age=0');
  try {
    const user = await findUserById(c.var.userId);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ show_email: user.show_email !== 0 });
  } catch {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
}

export async function handlePutAuthEmailVisibility(c: TranscribeContext) {
  c.header('Cache-Control', 'no-store, max-age=0');
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  const parsedBody = emailVisibilitySchema.safeParse(body);
  if (!parsedBody.success)
    return c.json({ error: 'Invalid request body' }, 400);

  try {
    const rowsUpdated = await updateUserEmailVisibility(
      c.var.userId,
      parsedBody.data.show_email,
    );
    if (rowsUpdated === 0n) return c.json({ error: 'Unauthorized' }, 401);
  } catch {
    return c.json({ error: 'Internal Server Error' }, 500);
  }

  let rebuildStatus: 'queued' | 'dispatch_failed' = 'queued';
  try {
    await dispatchGithubWorkflow();
  } catch {
    rebuildStatus = 'dispatch_failed';
    logger.error('account.email_visibility.workflow_dispatch_failed');
  }

  return c.json({
    show_email: parsedBody.data.show_email,
    rebuild_status: rebuildStatus,
  });
}
