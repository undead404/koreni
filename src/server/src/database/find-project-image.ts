import { sql } from 'kysely';

import database from './client.js';

interface ProjectImageRow {
  id: string;
  project_id: string;
  storage_key: string;
  page_sequence: number;
  page_name: string | null;
  height: number;
  width: number;
  created_at: number;
  blurhash: string;
  transcription: string | null;
  source_id: string | null;
  crop_x: number | null;
  side: string | null;
  is_active: number;
}

export async function findProjectImage(
  projectId: string,
  imageId: string,
): Promise<ProjectImageRow | undefined> {
  const result = await sql<ProjectImageRow>`
    SELECT
      id, project_id, storage_key, page_sequence, page_name,
      height, width, created_at, blurhash, transcription,
      source_id, crop_x, side, is_active
    FROM project_images
    WHERE id = ${imageId} AND project_id = ${projectId}
    LIMIT 1
  `.execute(database);

  return result.rows[0];
}
