import { z } from 'zod';

import { createProject } from '../database/create-project.js';
import findUserById from '../database/find-user-by-id.js';
import { projectCreatePayloadSchema } from '../schemata.js';
import type { TranscribeContext } from '../types.js';

export default async function handleTranscribeProjectCreate(
  c: TranscribeContext,
) {
  try {
    const body = (await c.req.json()) as unknown;
    const parsed = projectCreatePayloadSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: 'Validation failed', details: z.treeifyError(parsed.error) },
        400,
      );
    }

    const user = await findUserById(c.var.userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    const project = await createProject(parsed.data, c.var.userId);

    return c.json({
      project: {
        created_at: project.created_at,
        id: project.id,
        title: project.title,
        type: project.type,
      },
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === 'Project ID already exists'
    ) {
      return c.json({ error: 'Project ID already in use' }, 409);
    }
    console.error('Error creating project:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
}
