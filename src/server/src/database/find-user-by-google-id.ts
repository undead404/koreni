import database from './client.js';

export default async function findUserByGoogleId(googleId: string) {
  const user = await database
    .selectFrom('users')
    .select(['id', 'email', 'google_id'])
    .where('google_id', '=', googleId)
    .executeTakeFirst();

  return user;
}
