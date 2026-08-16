import { Context } from 'hono';
import { z } from 'zod';

import { updateProjectImage } from '../database/update-project-image.js';
import { getPublicUrl } from '../services/r2.js';

const patchImageSchema = z.object({
  pageName: z.string().nullable().optional(),
  transcription: z.string().optional(),
});

export default async function handleProjectImagePatch(c: Context) {
  const projectId = c.req.param('projectId');
  const imageId = c.req.param('imageId');

  if (!projectId || !imageId) {
    return c.json({ error: 'Missing projectId or imageId' }, 400);
  }

  try {
    const body = (await c.req.json()) as unknown;
    const parsedFields = patchImageSchema.safeParse(body);

    if (!parsedFields.success) {
      return c.json(
        { error: 'Invalid fields: ' + parsedFields.error.message },
        400,
      );
    }

    const { pageName, transcription } = parsedFields.data;

    const updatedImage = await updateProjectImage(projectId, imageId, {
      pageName,
      transcription,
    });

    if (!updatedImage) {
      return c.json({ error: 'Image not found' }, 404);
    }

    return c.json({
      success: true,
      image: {
        id: updatedImage.id,
        projectId: updatedImage.project_id,
        storageKey: updatedImage.storage_key,
        url: getPublicUrl(updatedImage.storage_key),
        pageSequence: updatedImage.page_sequence,
        pageName: updatedImage.page_name,
        height: updatedImage.height,
        width: updatedImage.width,
        createdAt: updatedImage.created_at,
        blurhash: updatedImage.blurhash,
        transcription: updatedImage.transcription,
      },
    });
  } catch (error) {
    console.error('Error handling project image PATCH:', error);
    return c.json({ error: 'Failed to update image' }, 500);
  }
}
