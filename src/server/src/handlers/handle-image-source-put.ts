import { Context } from 'hono';
import { z } from 'zod';

import { createImageSource } from '../database/create-image-source.js';
import { createProjectImage } from '../database/create-project.js';
import { getJpegDimensions } from '../helpers/get-jpeg-dimensions.js';
import { nonEmptyString } from '../schemata.js';
import { uploadProjectImageToR2 } from '../services/r2.js';

const bodySchema = z.object({
  pageSequence: z.coerce.number().int().nonnegative(),
  pageName: z.string().nullable().optional(),
  blurhash: nonEmptyString,
  pageId: nonEmptyString,
});

export default async function handleImageSourcePut(c: Context) {
  const projectId = c.req.param('projectId');
  const sourceId = c.req.param('sourceId');

  if (!projectId || !sourceId) {
    return c.json({ error: 'Missing projectId or sourceId' }, 400);
  }

  try {
    const body = (await c.req.parseBody()) as Record<
      string,
      string | File | undefined
    >;

    const parsedFields = bodySchema.safeParse({
      pageSequence: body.pageSequence ?? body.page_sequence,
      pageName: body.pageName ?? body.page_name ?? null,
      blurhash: body.blurhash,
      pageId: body.pageId ?? body.page_id,
    });

    if (!parsedFields.success) {
      return c.json(
        { error: 'Invalid fields: ' + parsedFields.error.message },
        400,
      );
    }

    const { pageSequence, pageName, blurhash, pageId } = parsedFields.data;

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
      sourceId,
      buffer,
      'image/jpeg',
    );

    try {
      await createImageSource({
        id: sourceId,
        projectId,
        storageKey: uploadResult.key,
        width: dimensions.width,
        height: dimensions.height,
        blurhash,
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === 'Source ID already exists'
      ) {
        return c.json({ error: 'Source already exists' }, 409);
      }
      throw error;
    }

    await createProjectImage({
      id: pageId,
      projectId,
      sourceId,
      storageKey: uploadResult.key,
      pageSequence,
      pageName: pageName ?? null,
      width: dimensions.width,
      height: dimensions.height,
      blurhash,
      cropX: null,
      side: null,
    });

    return c.json({
      success: true,
      sourceId,
      pageId,
      url: uploadResult.url,
    });
  } catch (error) {
    console.error('Error handling image source PUT:', error);
    return c.json({ error: 'Failed to upload image source' }, 500);
  }
}
