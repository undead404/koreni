import database from './client.js';

export type ReconcileResult =
  | {
      status: 'already_complete';
      leftPageId: string;
      rightPageId: string;
      cropX: number;
    }
  | { status: 'repaired' }
  | {
      status: 'conflict';
      existingCropX: number | null;
      leftPageId: string;
      rightPageId: string;
    };

const CROP_X_TOLERANCE = 0.001;

export async function reconcileSplit(
  sourceId: string,
  requestedCropX: number,
): Promise<ReconcileResult> {
  return database.transaction().execute(async (trx) => {
    const repairBrokenSplit = async (): Promise<void> => {
      // Deactivate any orphaned derived rows
      await trx
        .updateTable('project_images')
        .set({ is_active: 0 })
        .where('source_id', '=', sourceId)
        .where('side', 'is not', null)
        .where('is_active', '=', 1)
        .execute();

      // Re-activate the original unsplit row
      await trx
        .updateTable('project_images')
        .set({ is_active: 1 })
        .where('source_id', '=', sourceId)
        .where('side', 'is', null)
        .where('is_active', '=', 0)
        .execute();

      // Reset page_count to 1
      await trx
        .updateTable('project_image_sources')
        .set({ page_count: 1 })
        .where('id', '=', sourceId)
        .execute();

      // Emit structured warning
      console.warn(
        '[reconcileSplit] Repaired broken split for sourceId:',
        sourceId,
      );
    };

    // Query active derived pages
    const derivedPages = await trx
      .selectFrom('project_images')
      .select(['id', 'side', 'crop_x'])
      .where('source_id', '=', sourceId)
      .where('side', 'is not', null)
      .where('is_active', '=', 1)
      .execute();

    // Branch A: Split is genuinely complete
    if (derivedPages.length === 2) {
      const leftRow = derivedPages.find((row) => row.side === 'left');
      const rightRow = derivedPages.find((row) => row.side === 'right');

      if (!leftRow || !rightRow) {
        // Malformed state: 2 rows but not one left and one right
        // Treat as broken and repair
        await repairBrokenSplit();
        return { status: 'repaired' };
      }

      // Check if cropX matches (within tolerance)
      const existingCropX = leftRow.crop_x;
      if (
        existingCropX !== null &&
        Math.abs(existingCropX - requestedCropX) <= CROP_X_TOLERANCE
      ) {
        // Same crop — idempotent success
        return {
          status: 'already_complete',
          leftPageId: leftRow.id,
          rightPageId: rightRow.id,
          cropX: existingCropX,
        };
      }

      // Different crop — conflict
      return {
        status: 'conflict',
        existingCropX,
        leftPageId: leftRow.id,
        rightPageId: rightRow.id,
      };
    }

    // Branch B: Split is broken (0 or 1 derived rows)
    await repairBrokenSplit();
    return { status: 'repaired' };
  });
}
