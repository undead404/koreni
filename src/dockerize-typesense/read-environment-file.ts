import { readFileSync } from 'node:fs';

export default function readEnvironmentFile(): Record<string, string> {
  const lines = readFileSync('.env')
    .toString()
    .split('\n')
    .map((line) => line.trim());

  const environmentEntries: [string, string][] = [];
  for (const line of lines) {
    if (!line) {
      continue;
    }
    const lineParts = line.split('=');
    if (lineParts.length !== 2) {
      throw new Error('Invalid .env');
    }

    environmentEntries.push(lineParts as [string, string]);
  }

  return Object.fromEntries(environmentEntries);
}
