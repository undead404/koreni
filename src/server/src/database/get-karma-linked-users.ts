import database from './client.js';

export default async function getKarmaLinkedUsers() {
  const users = await database
    .selectFrom('users')
    .select(['email', 'karma_linked_at'])
    .where('karma_linked_at', 'is not', null)
    .execute();

  return users as Array<{ email: string; karma_linked_at: string }>;
}
