import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

import type { AxiosInstance } from 'axios';

import { DATA_DIR, TYPESENSE_PORT } from './config';
import { typesenseHealthcheckResponseSchema } from './schemata';
import waitUntil from './wait-until';

export default async function startTypesense(
  client: AxiosInstance,
  bootstrapKey: string,
) {
  // Create data directory if it doesn't exist
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR);
  }

  const command = `docker run -d --name typesense-server -p ${TYPESENSE_PORT}:8108 -v ${DATA_DIR}:/data typesense/typesense:28.0 --api-key=${bootstrapKey} --data-dir=/data`;
  console.log(command);
  // Run Typesense in Docker
  execSync(command, { stdio: 'inherit' });

  // Wait until Typesense is ready

  await waitUntil(async () => {
    try {
      const response = await client.get('/health');
      console.log(response.data);
      return typesenseHealthcheckResponseSchema.parse(response.data).ok;
    } catch {
      console.log('Please wait...');
      return false;
    }
  }, 10_000);

  console.log(
    'Typesense successfully started in Docker at localhost:' + TYPESENSE_PORT,
  );
}
