import type { AxiosInstance } from 'axios';

import { typesenseKeysPostResponseSchema } from './schemata';
import writeEnvironmentValues from './write-environment-values';

export default async function getTypesenseAdminKey(
  client: AxiosInstance,
  apiKey: string,
  isBootstrap: boolean,
) {
  console.log('getTypesenseAdminKey', apiKey, isBootstrap);
  if (!isBootstrap && process.env.TYPESENSE_ADMIN_KEY) {
    console.log('Typesense admin key already exists.');
    return process.env.TYPESENSE_ADMIN_KEY;
  }
  const adminKeyResponse = await client.post(
    '/keys',
    {
      description: 'Admin key',
      actions: ['*'],
      collections: ['*'],
      // expires_at: 0,
    },
    {
      headers: { 'X-TYPESENSE-API-KEY': apiKey },
    },
  );
  const adminKey =
    typesenseKeysPostResponseSchema.parse(adminKeyResponse).data.value;
  writeEnvironmentValues({
    TYPESENSE_ADMIN_KEY: adminKey,
  });
  console.log(
    'Typesense admin key successfully created and added to .env file',
  );
  return adminKey;
}
