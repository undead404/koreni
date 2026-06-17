import generateId from '../helpers/generate-id.js';

import database from './client.js';

export default async function upsertUser({
  email,
  googleId,
}: {
  email: string;
  googleId: string;
}) {
  const user = await database
    .insertInto('users')
    .values({
      id: generateId(),
      google_id: googleId,
      email,
    })
    .onConflict((oc) =>
      oc.column('google_id').doUpdateSet({
        email, // Synchronize with the latest email from the OAuth provider
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();

  return user;
}
