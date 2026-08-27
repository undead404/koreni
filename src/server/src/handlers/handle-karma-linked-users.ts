import type { Context } from 'hono';

import getKarmaLinkedUsers from '../database/get-karma-linked-users.js';
import environment from '../environment.js';
import { karmaLinkedUsersResponseSchema } from '../schemata.js';

const handleKarmaLinkedUsers = async (c: Context) => {
  const authHeader = c.req.header('authorization');

  if (
    !authHeader ||
    !environment.KARMA_INTERNAL_TOKEN ||
    authHeader !== `Bearer ${environment.KARMA_INTERNAL_TOKEN}`
  ) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const users = await getKarmaLinkedUsers();
  const parseResult = karmaLinkedUsersResponseSchema.safeParse({ users });

  if (!parseResult.success) {
    return c.json({ error: 'Internal Server Error' }, 500);
  }

  return c.json(parseResult.data);
};

export default handleKarmaLinkedUsers;
