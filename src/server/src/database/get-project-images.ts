import database from './client.js';

export interface GetProjectImagesOptions {
  withTranscription?: boolean;
}

export function getProjectImages(
  projectId: string,
  options?: GetProjectImagesOptions,
) {
  const baseColumns = [
    'id',
    'project_id as projectId',
    'storage_key as storageKey',
    'page_sequence as pageSequence',
    'page_name as pageName',
    'height',
    'width',
    'created_at as createdAt',
    'blurhash',
  ] as const;

  const query = database
    .selectFrom('project_images')
    .where('project_id', '=', projectId)
    .orderBy('page_sequence', 'asc');

  if (options?.withTranscription) {
    return query.select([...baseColumns, 'transcription']).execute();
  }

  return query.select(baseColumns).execute();
}
