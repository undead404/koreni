import { logger } from '../logger.js';

import database from './client.js';

export async function linkUserKarma(
  userId: string,
  timestamp: string = new Date().toISOString(),
) {
  await database
    .updateTable('users')
    .set({ karma_linked_at: timestamp })
    .where('id', '=', userId)
    .execute();
  logger.info('domain.karma.linked', { userId });
}
