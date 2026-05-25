import { Context } from 'hono';

import { r2UploadSchema } from '../schemata.js';
import { uploadImageToR2 } from '../services/r2.js';

export default async function handleR2Upload(c: Context) {
  try {
    const body = await c.req.parseBody();

    const projectIdRaw = body.projectId || c.req.query('projectId');

    const parsed = r2UploadSchema.safeParse({ projectId: projectIdRaw });
    if (!parsed.success) {
      return c.json({ error: 'Invalid or missing projectId' }, 400);
    }

    const { projectId } = parsed.data;

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

    const sanitizedFileName = file.name.replaceAll(/[^\w.-]/g, '_');

    const result = await uploadImageToR2(
      projectId,
      sanitizedFileName,
      buffer,
      'image/jpeg',
    );

    return c.json({ success: true, ...result });
  } catch (error) {
    console.error('Error handling R2 upload:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
}
