import { LibsqlDialect } from '@libsql/kysely-libsql';
import { Kysely } from 'kysely';

import environment from '../environment.js';

import type { DB } from './generated.js';

const database = new Kysely<DB>({
  dialect: new LibsqlDialect({
    url: environment.TURSO_DATABASE_URL,
    ...(environment.TURSO_DATABASE_TOKEN && {
      authToken: environment.TURSO_DATABASE_TOKEN,
    }),
  }),
});

export default database;
