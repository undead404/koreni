import { z } from 'zod';

import { createProject } from '../database/create-project.js';
import { projectCreatePayloadSchema } from '../schemata.js';
import { TranscribeContext } from '../types.js';

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

    const project = await createProject(parsed.data, c.var.userId);

    return c.json({
      projects: [
        {
          created_at: project.created_at,
          id: project.id,
          title: project.title,
        },
      ],
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
