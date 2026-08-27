import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'yaml';

import { type Archive, archiveSchema } from './schemas/archive';
import getYamlFilepaths from './get-yaml-filepaths';

const ARCHIVES_FOLDER = path.join(process.cwd(), 'data/archives');

export default async function getArchivesMetadata(): Promise<
  ReadonlyMap<string, Archive>
> {
  const archiveFilepaths = await getYamlFilepaths(ARCHIVES_FOLDER);
  const archives = new Map<string, Archive>();

  for (const archiveFilepath of archiveFilepaths) {
    const fileContent = await readFile(archiveFilepath, 'utf8');
    const archive = archiveSchema.parse(parse(fileContent) as unknown);
    const filename = path.basename(archiveFilepath, '.yaml');

    if (
      filename.toLocaleLowerCase() !== archive.shortTitle.toLocaleLowerCase()
    ) {
      throw new Error(`Archive filename mismatch: ${archiveFilepath}`);
    }

    if (archives.has(archive.shortTitle)) {
      throw new Error(`Duplicate archive: ${archive.shortTitle}`);
    }

    archives.set(archive.shortTitle, archive);
  }

  return archives;
}
