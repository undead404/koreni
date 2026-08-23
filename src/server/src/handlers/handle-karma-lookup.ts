import findUserById from '../database/find-user-by-id.js';
import environment from '../environment.js';
import { karmaLookupResponseSchema } from '../schemata.js';
import {
  navigatorClient,
  NavigatorClientError,
} from '../services/navigator-client.js';
import type { TranscribeContext } from '../types.js';

export default async function handleKarmaLookup(c: TranscribeContext) {
  const user = await findUserById(c.var.userId);
  if (!user) {
    return c.json({ user: null }, 401);
  }

  if (!environment.KARMA_APP_SLUG) {
    return c.json({ error: 'karma_not_configured' }, 503);
  }

  try {
    const response = await navigatorClient.lookupKarma({
      service: environment.KARMA_APP_SLUG,
      users: [(user.contribution_email ?? user.email).toLowerCase().trim()],
    });
    const result = response.results.find(
      (item) =>
        item.user.toLowerCase().trim() ===
        (user.contribution_email ?? user.email).toLowerCase().trim(),
    );

    return c.json(
      karmaLookupResponseSchema.parse(
        result ?? { found: false, serviceKarma: 0, totalKarma: 0 },
      ),
    );
  } catch (error) {
    if (error instanceof NavigatorClientError) {
      return c.json({ error: 'navigator_lookup_unavailable' }, 502);
    }

    if (error instanceof Error) {
      return c.json({ error: 'navigator_lookup_invalid' }, 502);
    }

    return c.json({ error: 'Internal Server Error' }, 500);
  }
}
