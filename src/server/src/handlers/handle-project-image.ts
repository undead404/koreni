import { Context } from 'hono';
import { z } from 'zod';

import { createProjectImage } from '../database/create-project.js';
import { deleteProjectImage } from '../database/delete-project-image.js';
import { findProjectImage } from '../database/find-project-image.js';
import { getJpegDimensions } from '../helpers/get-jpeg-dimensions.js';
import { nonEmptyString } from '../schemata.js';
import { deleteImageFromR2, uploadProjectImageToR2 } from '../services/r2.js';

export default async function handleProjectImage(c: Context) {
  const method = c.req.method;
  const projectId = c.req.param('projectId');
  const imageId = c.req.param('imageId');

  if (!projectId || !imageId) {
    return c.json({ error: 'Missing projectId or imageId' }, 400);
  }

  if (method === 'PUT') {
    try {
      const body = (await c.req.parseBody()) as Record<
        string,
        string | File | undefined
      >;

      const pageSequenceRaw = body.pageSequence ?? body.page_sequence;
      const pageNameRaw = body.pageName ?? body.page_name ?? null;
      const blurhashRaw = body.blurhash;

      const parsedFields = z
        .object({
          pageSequence: z.coerce.number().int().nonnegative(),
          pageName: z.string().nullable().optional(),
          blurhash: nonEmptyString,
        })
        .safeParse({
          pageSequence: pageSequenceRaw,
          pageName: pageNameRaw,
          blurhash: blurhashRaw,
        });

      if (!parsedFields.success) {
        return c.json(
          { error: 'Invalid fields: ' + parsedFields.error.message },
          400,
        );
      }

      const { pageSequence, pageName, blurhash } = parsedFields.data;

      const file = body.file || body.image;
      if (!file || !(file instanceof File)) {
        return c.json({ error: 'Missing or invalid file' }, 400);
      }

      const isJpeg =
        file.type === 'image/jpeg' ||
        file.type === 'image/jpg' ||
        file.name.toLowerCase().endsWith('.jpg') ||
        file.name.toLowerCase().endsWith('.jpeg');

      if (!isJpeg) {
        return c.json({ error: 'Only JPEG images are allowed' }, 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let dimensions;
      try {
        dimensions = getJpegDimensions(buffer);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return c.json({ error: `Invalid JPEG file: ${message}` }, 400);
      }

      const uploadResult = await uploadProjectImageToR2(
        projectId,
        imageId,
        buffer,
        'image/jpeg',
      );

      await createProjectImage({
        id: imageId,
        projectId,
        storageKey: uploadResult.key,
        pageSequence,
        pageName: pageName || null,
        height: dimensions.height,
        width: dimensions.width,
        blurhash,
      });

      return c.json({
        success: true,
        key: uploadResult.key,
        url: uploadResult.url,
      });
    } catch (error) {
      console.error('Error handling project image PUT:', error);
      return c.json({ error: 'Failed to upload image' }, 500);
    }
  } else if (method === 'DELETE') {
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
  } else {
    return c.json({ error: 'Method Not Allowed' }, 405);
  }
}
