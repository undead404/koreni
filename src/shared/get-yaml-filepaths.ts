import { readdir } from 'node:fs/promises';
import path from 'node:path';

export default async function getYamlFilepaths(
  folder: string,
): Promise<string[]> {
  const directory = await readdir(folder);
  const yamlFilepaths = directory
    .filter((filename) => filename.endsWith('.yaml'))
    .map((filename) => path.join(folder, filename));
  return yamlFilepaths;
}
