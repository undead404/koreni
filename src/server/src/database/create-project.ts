import { db as database } from './index.js';

export async function createProject(projectData: any) {
  try {
    const result = await database
      .insertInto('projects')
      .values({
        id: projectData.id,
        title: projectData.title,
        author_email: projectData.authorEmail,
        author_github_username: projectData.authorGithubUsername,
        author_name: projectData.authorName,
        is_handwritten: projectData.isHandwritten ? 1 : 0,
        location_lat: projectData.location[0],
        location_lng: projectData.location[1],
        sources: JSON.stringify(projectData.sources),
        table_locale: projectData.tableLocale,
        years_range: JSON.stringify(projectData.yearsRange),
        created_at: new Date().toISOString(),
      })
      .returning(['id', 'title', 'created_at'])
      .executeTakeFirstOrThrow();

    return result;
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed') || error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === 'SQLITE_CONSTRAINT') {
      throw new Error('Project ID already exists');
    }
    throw error;
  }
}
