import database from './client.js';

export function getProjectImages(projectId: string) {
  return database
    .selectFrom('project_images')
    .select([
      'id',
      'project_id as projectId',
      'storage_key as storageKey',
      'page_sequence as pageSequence',
      'page_name as pageName',
      'height',
      'width',
      'created_at as createdAt',
      'blurhash',
    ])
    .where('project_id', '=', projectId)
    .orderBy('page_sequence', 'asc')
    .execute();
}
