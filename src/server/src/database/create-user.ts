import database from './client.js';

export default async function createUser({
  email,
  googleId,
  id,
}: {
  email: string;
  googleId: string;
  id: string;
}) {
  const user = await database
    .insertInto('users')
    .values({ google_id: googleId, id, email })
    .executeTakeFirst();

  return user;
}
