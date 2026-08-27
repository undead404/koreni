import database from './client.js';

export default function findProject(projectId: string, userId: string) {
  return database
    .selectFrom('projects')
    .where('id', '=', projectId)
    .where('user_id', '=', userId)
    .selectAll()
    .executeTakeFirst();
}
