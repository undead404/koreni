import database from './client.js';

export async function revertSplit(
  sourceId: string,
  projectId: string,
): Promise<void> {
  await database.transaction().execute(async (trx) => {
    // Verify the source exists and belongs to the project
    const source = await trx
      .selectFrom('project_image_sources')
      .select('id')
      .where('id', '=', sourceId)
      .where('project_id', '=', projectId)
      .executeTakeFirst();

    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    // Soft-delete the derived pages
    await trx
      .updateTable('project_images')
      .set({ is_active: 0 })
      .where('source_id', '=', sourceId)
      .where('is_active', '=', 1)
      .execute();

    // Reset the source to single page
    await trx
      .updateTable('project_image_sources')
      .set({ page_count: 1 })
      .where('id', '=', sourceId)
      .execute();
  });
}
