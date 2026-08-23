import findUserById from '../database/find-user-by-id.js';
import { karmaStatusResponseSchema } from '../schemata.js';
import {
  getUserKarmaContributionStats,
  KarmaSourceUnavailableError,
} from '../services/karma-calculator.js';
import type { TranscribeContext } from '../types.js';

export default async function handleKarmaStatus(c: TranscribeContext) {
  try {
    const user = await findUserById(c.var.userId);
    if (!user) {
      return c.json({ user: null }, 401);
    }

    const stats = await getUserKarmaContributionStats(
      user.contribution_email ?? user.email,
      {
        requestId: c.var.requestId,
      },
    );
    return c.json(
      karmaStatusResponseSchema.parse({
        tables: stats.tableCount,
        rows: stats.rowCount,
        user: {
          email: user.email,
          karma_linked_at: user.karma_linked_at,
        },
      }),
    );
  } catch (error) {
    if (error instanceof KarmaSourceUnavailableError) {
      return c.json({ error: 'Karma source unavailable' }, 502);
    }

    return c.json({ error: 'Internal Server Error' }, 500);
  }
}
