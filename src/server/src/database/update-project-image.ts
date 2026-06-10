import { sql } from 'kysely';

import database from './client.js';

export function updateProjectImage(
  projectId: string,
  imageId: string,
  data: {
    pageName?: string | null;
    transcription?: string;
  },
) {
  if (!data.pageName && !data.transcription) {
    throw new Error('No update provided');
  }
  const updateData: Record<string, unknown> = {
    updated_at: sql`unixepoch()`,
  };

  if (data.pageName !== undefined) {
    updateData.page_name = data.pageName;
  }

  if (data.transcription !== undefined) {
    updateData.transcription = data.transcription;
  }

  return database
    .updateTable('project_images')
    .set(updateData)
    .where('id', '=', imageId)
    .where('project_id', '=', projectId)
    .returning([
      'id',
      'project_id',
      'storage_key',
      'page_sequence',
      'page_name',
      'height',
      'width',
      'created_at',
      'blurhash',
      'transcription',
    ])
    .executeTakeFirst();
}
