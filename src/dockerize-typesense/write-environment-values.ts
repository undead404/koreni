import { writeFileSync } from 'node:fs';

import readEnvironmentFile from './read-environment-file';

export default function writeEnvironmentValues(keys: Record<string, string>) {
  const oldEnvironment = readEnvironmentFile();
  const environmentContent = Object.entries({ ...oldEnvironment, ...keys })
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  writeFileSync('.env', environmentContent);
}
