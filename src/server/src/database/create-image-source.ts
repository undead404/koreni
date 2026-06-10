import type { ImageSourceCreate } from '../schemata.js';

import database from './client.js';

export async function createImageSource(
  data: ImageSourceCreate,
): Promise<void> {
  try {
    await database.transaction().execute(async (trx) => {
      await trx
        .insertInto('project_image_sources')
        .values({
          blurhash: data.blurhash,
          height: data.height,
          id: data.id,
          project_id: data.projectId,
          storage_key: data.storageKey,
          width: data.width,
        })
        .execute();
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes('UNIQUE constraint failed') ||
        ('code' in error &&
          (error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
            error.code === 'SQLITE_CONSTRAINT')))
    ) {
      throw new Error('Source ID already exists');
    }
    throw error;
  }
}
