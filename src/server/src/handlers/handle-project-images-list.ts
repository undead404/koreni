import { Context } from 'hono';

import { getProjectImages } from '../database/get-project-images.js';

export default async function handleProjectImagesList(c: Context) {
  const projectId = c.req.param('projectId');

  if (!projectId) {
    return c.json({ error: 'Missing projectId' }, 400);
  }

  try {
    const images = await getProjectImages(projectId);

    return c.json({
      success: true,
      images,
    });
  } catch (error) {
    console.error('Error listing project images:', error);
    return c.json({ error: 'Failed to list project images' }, 500);
  }
}
