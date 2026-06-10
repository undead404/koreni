import type { SpreadSplit } from '../schemata.js';

import database from './client.js';

export async function createDerivedPages(
  sourceId: string,
  split: SpreadSplit,
): Promise<void> {
  await database.transaction().execute(async (trx) => {
    // Fetch the source row using Kysely's type-aware query builder
    const source = await trx
      .selectFrom('project_image_sources')
      .select(['project_id', 'storage_key', 'width', 'height', 'blurhash'])
      .where('id', '=', sourceId)
      .executeTakeFirst();

    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    // Update the source to mark it as split using query builder
    await trx
      .updateTable('project_image_sources')
      .set({ page_count: 2 })
      .where('id', '=', sourceId)
      .execute();

    // Insert left page using sql for complex column mapping

    await trx
      .insertInto('project_images')
      .values({
        blurhash: source.blurhash,
        crop_x: split.cropX,
        height: source.height,
        id: split.leftPageId,
        is_active: 1,
        page_name: split.leftPageName,
        page_sequence: split.leftPageSequence,
        project_id: source.project_id,
        side: 'left',
        source_id: sourceId,
        storage_key: source.storage_key,
        width: source.width,
      })
      .execute();

    await trx
      .insertInto('project_images')
      .values({
        blurhash: source.blurhash,
        crop_x: split.cropX,
        height: source.height,
        id: split.rightPageId,
        is_active: 1,
        page_name: split.rightPageName,
        page_sequence: split.rightPageSequence,
        project_id: source.project_id,
        side: 'right',
        source_id: sourceId,
        storage_key: source.storage_key,
        width: source.width,
      })
      .execute();
  });
}
