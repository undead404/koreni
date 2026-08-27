import database from './client.js';

export function findProjectImage(projectId: string, imageId: string) {
  return database
    .selectFrom('project_images')
    .select([
      'id',
      'project_id',
      'storage_key',
      'page_sequence',
      'page_name',
      'height',
      'width',
      'created_at',
      'blurhash',
    ])
    .where('id', '=', imageId)
    .where('project_id', '=', projectId)
    .executeTakeFirst();
}
