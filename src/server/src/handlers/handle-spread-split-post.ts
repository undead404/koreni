import { Context } from 'hono';

import { createDerivedPages } from '../database/create-derived-pages.js';
import { findImageSource } from '../database/find-image-source.js';
import { reconcileSplit } from '../database/reconcile-split.js';
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

    if (source.page_count === 1) {
      // Happy path: source is not yet split
      await createDerivedPages(sourceId, parsed.data);
      return c.json({
        success: true,
        sourceId,
        leftPageId: parsed.data.leftPageId,
        rightPageId: parsed.data.rightPageId,
      });
    }

    // source.page_count === 2: reconcile the split state
    const reconcileResult = await reconcileSplit(sourceId, parsed.data.cropX);

    switch (reconcileResult.status) {
      case 'already_complete': {
        // Idempotent success: split already exists with same cropX
        return c.json({
          success: true,
          sourceId,
          leftPageId: reconcileResult.leftPageId,
          rightPageId: reconcileResult.rightPageId,
        });
      }

      case 'conflict': {
        // Genuine conflict: split exists with different cropX
        return c.json(
          {
            error: 'Source is already split with a different crop',
            existingCropX: reconcileResult.existingCropX,
            leftPageId: reconcileResult.leftPageId,
            rightPageId: reconcileResult.rightPageId,
          },
          409,
        );
      }

      case 'repaired': {
        // Broken split was repaired; now proceed with the split
        await createDerivedPages(sourceId, parsed.data);
        return c.json({
          success: true,
          sourceId,
          leftPageId: parsed.data.leftPageId,
          rightPageId: parsed.data.rightPageId,
        });
      }
    }
  } catch (error) {
    console.error('Error handling spread split POST:', error);
    return c.json({ error: 'Failed to split spread' }, 500);
  }
}
