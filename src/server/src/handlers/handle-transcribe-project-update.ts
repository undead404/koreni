import { z } from 'zod';

import updateProject from '../database/update-project.js';
import { projectCreatePayloadSchema } from '../schemata.js';
import type { TranscribeContext } from '../types.js';

export default async function handleTranscribeProjectUpdate(
  c: TranscribeContext,
) {
  try {
    const projectId = c.req.param('projectId');
    if (!projectId) {
      return c.json({ error: 'Missing projectId' }, 400);
    }

    const body = (await c.req.json()) as unknown;
    const updateSchema = projectCreatePayloadSchema.omit({ id: true });
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: 'Validation failed', details: z.treeifyError(parsed.error) },
        400,
      );
    }

    const updated = await updateProject(projectId, c.var.userId, parsed.data);

    if (!updated) {
      return c.json({ error: 'Project not found or not owned by user' }, 404);
    }

    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('Error updating project:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
}
