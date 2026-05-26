import { Context } from 'hono';

import database from '../database/client.js';

export default async function handleProjectImages(c: Context) {
  try {
    const projectId = c.req.param('projectId');
    const imageId = c.req.param('imageId');

    const image = await database
      .selectFrom('project_images')
      .selectAll()
      .where('id', '=', imageId)
      .where('project_id', '=', projectId)
      .executeTakeFirst();

    if (!image) {
      return c.json({ error: 'Image not found' }, 404);
    }

    return c.json({
      success: true,
      image: {
        id: image.id,
        projectId: image.project_id,
        storageKey: image.storage_key,
        pageSequence: image.page_sequence,
        pageName: image.page_name,
        height: image.height,
        width: image.width,
        createdAt: image.created_at,
        blurhash: image.blurhash,
      },
    });
  } catch (error) {
    console.error('Error getting project image:', error);
    return c.json({ error: 'Failed to retrieve image' }, 500);
  }
}
