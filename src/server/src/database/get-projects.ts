import database from './client.js';

export default function getProjects() {
  return database
    .selectFrom('projects')
    .select(['id', 'title', 'created_at', 'user_id'])
    .execute();
}
