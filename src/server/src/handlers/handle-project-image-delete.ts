import { Context } from 'hono';

import { deleteProjectImage } from '../database/delete-project-image.js';
import { findProjectImage } from '../database/find-project-image.js';
import { deleteImageFromR2 } from '../services/r2.js';

export default async function handleProjectImageDelete(c: Context) {
  const projectId = c.req.param('projectId');
  const imageId = c.req.param('imageId');

  if (!projectId || !imageId) {
    return c.json({ error: 'Missing projectId or imageId' }, 400);
  }

  try {
    const image = await findProjectImage(projectId, imageId);

    if (!image) {
      return c.json({ error: 'Image record not found' }, 404);
    }

    await deleteImageFromR2(image.storage_key);

    await deleteProjectImage(projectId, imageId);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error handling project image DELETE:', error);
    return c.json({ error: 'Failed to delete image' }, 500);
  }
}
