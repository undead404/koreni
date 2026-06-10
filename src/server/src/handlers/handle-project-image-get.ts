import { Context } from 'hono';

import { findProjectImage } from '../database/find-project-image.js';

export default async function handleProjectImageGet(c: Context) {
  const projectId = c.req.param('projectId');
  const imageId = c.req.param('imageId');

  if (!projectId || !imageId) {
    return c.json({ error: 'Missing projectId or imageId' }, 400);
  }

  try {
    const image = await findProjectImage(projectId, imageId);

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
