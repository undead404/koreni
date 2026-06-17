import { sql } from 'kysely';

import database from './client.js';

export default async function revokeUserSessions(userId: string) {
  await database
    .updateTable('users')
    .set({
      // Atomic increment: executes purely within the database engine
      token_version: sql`token_version + 1`,
    })
    .where('id', '=', userId)
    .executeTakeFirstOrThrow();
}
