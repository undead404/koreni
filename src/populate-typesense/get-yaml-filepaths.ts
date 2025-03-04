import { readdir } from 'node:fs/promises';
import path from 'node:path';

export default async function getYamlFilepaths(
  folder: string,
): Promise<string[]> {
  const yamlFilepaths = (await readdir(folder))
    .filter((filename) => filename.endsWith('.yml'))
    .map((filename) => path.join(folder, filename));
  return yamlFilepaths;
}
