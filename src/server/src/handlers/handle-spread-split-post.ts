import { Context } from 'hono';

import { createDerivedPages } from '../database/create-derived-pages.js';
import { findImageSource } from '../database/find-image-source.js';
import { spreadSplitSchema } from '../schemata.js';

export default async function handleSpreadSplitPost(c: Context) {
  const projectId = c.req.param('projectId');
  const sourceId = c.req.param('sourceId');

  if (!projectId || !sourceId) {
    return c.json({ error: 'Missing projectId or sourceId' }, 400);
  }

  try {
    const body: unknown = await c.req.json();
    const parsed = spreadSplitSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid fields: ' + parsed.error.message }, 400);
    }

    const source = await findImageSource(sourceId, projectId);
    if (!source) {
      return c.json({ error: 'Source not found' }, 404);
    }

    if (source.page_count === 2) {
      return c.json({ error: 'Source is already split' }, 409);
    }

    await createDerivedPages(sourceId, parsed.data);

    return c.json({
      success: true,
      sourceId,
      leftPageId: parsed.data.leftPageId,
      rightPageId: parsed.data.rightPageId,
    });
  } catch (error) {
    console.error('Error handling spread split POST:', error);
    return c.json({ error: 'Failed to split spread' }, 500);
  }
}
