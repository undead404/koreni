import database from './client.js';

export interface GetProjectImagesOptions {
  withTranscription?: boolean;
}

interface ProjectImageRow {
  id: string;
  projectId: string;
  storageKey: string;
  pageSequence: number;
  pageName: string | null;
  height: number;
  width: number;
  createdAt: number;
  blurhash: string;
  transcription?: string | null;
  sourceId: string | null;
  cropX: number | null;
  side: string | null;
  isActive: number;
}

export async function getProjectImages(
  projectId: string,
  options?: GetProjectImagesOptions,
): Promise<ProjectImageRow[]> {
  let query = database
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
      'source_id as sourceId',
      'crop_x as cropX',
      'side',
      'is_active as isActive',
    ]);

  // Conditionally add transcription column
  if (options?.withTranscription) {
    query = query.select('transcription');
  }

  const rows = await query
    .where('project_id', '=', projectId)
    .where((eb) =>
      eb.or([eb('is_active', '=', 1), eb('is_active', 'is', null)]),
    )
    .orderBy('page_sequence', 'asc')
    .execute();

  return rows as ProjectImageRow[];
}
