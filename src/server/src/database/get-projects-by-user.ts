import database from './client.js';

export default function getProjectsByUser(userId: string) {
  return database
    .selectFrom('projects')
    .where('user_id', '=', userId)
    .select(['id', 'title', 'created_at'])
    .execute();
}
