import database from './client.js';
import type { ProjectImageSource } from './types.js';

export async function findImageSource(
  sourceId: string,
  projectId: string,
): Promise<ProjectImageSource | undefined> {
  const result = await database
    .selectFrom('project_image_sources')
    .select([
      'id',
      'project_id',
      'storage_key',
      'width',
      'height',
      'blurhash',
      'page_count',
      'created_at',
    ])
    .where('id', '=', sourceId)
    .where('project_id', '=', projectId)
    .executeTakeFirst();

  if (!result) {
    return undefined;
  }

  const createdAt =
    typeof result.created_at === 'string'
      ? Number.parseInt(result.created_at, 10)
      : result.created_at;

  const imageSource: ProjectImageSource = {
    ...result,
    created_at: createdAt,
  };

  return imageSource;
}
