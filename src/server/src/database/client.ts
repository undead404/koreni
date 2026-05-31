import { createClient } from '@libsql/client';
import { LibsqlDialect } from '@libsql/kysely-libsql';
import { Kysely } from 'kysely';
import type { DB } from 'kysely-codegen';

import environment from '../environment.js';

const libsql = createClient({
  url: environment.TURSO_DATABASE_URL,
  ...(environment.TURSO_DATABASE_TOKEN && {
    authToken: environment.TURSO_DATABASE_TOKEN,
  }),
});

const database = new Kysely<DB>({
  dialect: new LibsqlDialect({
    client: libsql,
  }),
});

export default database;
