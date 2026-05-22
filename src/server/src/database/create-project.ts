import type { ProjectCreatePayload } from '../schemata.js';

import database from './client.js';

export async function createProject(
  projectData: ProjectCreatePayload,
  userId: string,
) {
  try {
    const result = await database
      .insertInto('projects')
      .values({
        id: projectData.id,
        title: projectData.title,
        is_handwritten: projectData.isHandwritten ? 1 : 0,
        latitude: projectData.location[0],
        locale: projectData.tableLocale,
        longitude: projectData.location[1],
        sources: JSON.stringify(projectData.sources),
        year_start: projectData.yearsRange[0],
        year_end: projectData.yearsRange[1] ?? projectData.yearsRange[0],
        user_id: userId,
      })
      .returning(['id', 'title', 'created_at'])
      .executeTakeFirstOrThrow();

    return result;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes('UNIQUE constraint failed') ||
        ('code' in error &&
          (error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
            error.code === 'SQLITE_CONSTRAINT')))
    ) {
      throw new Error('Project ID already exists');
    }
    throw error;
  }
}
