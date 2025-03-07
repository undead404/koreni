import type { AxiosInstance } from 'axios';

import { typesenseKeysPostResponseSchema } from './schemata';
import writeEnvironmentValues from './write-environment-values';

export default async function getTypesenseSearchKey(
  client: AxiosInstance,
  apiKey: string,
  isBootstrap: boolean,
) {
  if (!isBootstrap && process.env.TYPESENSE_SEARCH_KEY) {
    console.log('Typesense search key already exists.');
    return process.env.TYPESENSE_SEARCH_KEY;
  }
  const searchKeyResponse = await client.post(
    '/keys',
    {
      description: 'Search key',
      actions: ['documents:search'],
      collections: ['*'],
      //   expires_at: 0,
    },
    {
      headers: { 'X-TYPESENSE-API-KEY': apiKey },
    },
  );
  const searchKey =
    typesenseKeysPostResponseSchema.parse(searchKeyResponse).data.value;
  writeEnvironmentValues({
    NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: searchKey,
  });
  console.log(
    'Typesense search key successfully created and added to .env file',
  );
  return searchKey;
}
