import { Context } from 'hono';

import { findImageSource } from '../database/find-image-source.js';
import { revertSplit } from '../database/revert-split.js';

export default async function handleSpreadRevertDelete(c: Context) {
  const projectId = c.req.param('projectId');
  const sourceId = c.req.param('sourceId');

  if (!projectId || !sourceId) {
    return c.json({ error: 'Missing projectId or sourceId' }, 400);
  }

  try {
    const source = await findImageSource(sourceId, projectId);
    if (!source) {
      return c.json({ error: 'Source not found' }, 404);
    }

    if (source.page_count !== 2) {
      return c.json({ error: 'Source is not currently split' }, 409);
    }

    await revertSplit(sourceId, projectId);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error handling spread revert DELETE:', error);
    return c.json({ error: 'Failed to revert split' }, 500);
  }
}
