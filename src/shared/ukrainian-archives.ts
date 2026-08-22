import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const archivesPath = path.resolve(
  currentDirectory,
  '../../data/ukrainian_archives.txt',
);

const UKRAINIAN_ARCHIVES = readFileSync(archivesPath)
  .toString()
  .split('\n')
  .filter(Boolean);

export default UKRAINIAN_ARCHIVES;
