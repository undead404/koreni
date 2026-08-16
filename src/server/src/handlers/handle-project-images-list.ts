import { Context } from 'hono';

import { getProjectImages } from '../database/get-project-images.js';
import { getPublicUrl } from '../services/r2.js';

export default async function handleProjectImagesList(c: Context) {
  const projectId = c.req.param('projectId');

  if (!projectId) {
    return c.json({ error: 'Missing projectId' }, 400);
  }

  const withTranscription = c.req.query('withTranscription') === 'true';

  try {
    const images = await getProjectImages(projectId, { withTranscription });
    const imagesWithUrls = images.map((image) => ({
      ...image,
      url: getPublicUrl(image.storageKey),
    }));

    return c.json({
      success: true,
      images: imagesWithUrls,
    });
  } catch (error) {
    console.error('Error listing project images:', error);
    return c.json({ error: 'Failed to list project images' }, 500);
  }
}
