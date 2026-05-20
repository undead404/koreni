import { Context } from 'hono';

import { createProject } from '../database/create-project.js';
import { projectCreatePayloadSchema } from '../schemata.js';

export default async function handleTranscribeProjectCreate(c: Context) {
  try {
    const body = await c.req.json();
    const parsed = projectCreatePayloadSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.format() }, 400);
    }

    const project = await createProject(parsed.data);

    return c.json({
      projects: [
        {
          created_at: project.created_at,
          id: project.id,
          title: project.title,
        },
      ],
    });
  } catch (error: any) {
    if (error.message === 'Project ID already exists') {
      return c.json({ error: 'Project ID already in use' }, 409);
    }
    console.error('Error creating project:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
}
