import database from './client.js';

export default async function findUserById(id: string) {
  const user = await database
    .selectFrom('users')
    .select(['id', 'email', 'google_id', 'is_admin'])
    .where('id', '=', id)
    .executeTakeFirst();

  return user;
}
