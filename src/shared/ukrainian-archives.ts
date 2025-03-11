import { readFileSync } from 'node:fs';

const UKRAINIAN_ARCHIVES = readFileSync('./data/ukrainian_archives.txt')
  .toString()
  .split('\n')
  .filter(Boolean);

export default UKRAINIAN_ARCHIVES;
