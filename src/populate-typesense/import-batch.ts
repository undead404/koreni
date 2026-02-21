import _ from 'lodash';

import calculatePayloadSizeInBytes from './calculate-payload-size-in-bytes';
import type { RowForImport } from './types';
import typesense from './typesense';

const BATCH_SIZE_LIMIT = 1_000_000;

export default async function importBatch(
  collectionName: string,
  batch: RowForImport[],
) {
  const batchSizeInBytes = calculatePayloadSizeInBytes(batch);
  console.log(
    `importBatch for a batch of ${batch.length} weighing ${batchSizeInBytes}`,
  );
  if (batchSizeInBytes > BATCH_SIZE_LIMIT) {
    let processedSize = 0;
    console.log(`Batch too big: ${batch.length}. Splitting it in halves.`);
    const chunks = _.chunk(batch, Math.trunc(batch.length / 2));
    for (const chunk of chunks) {
      processedSize += await importBatch(collectionName, chunk);
    }
    if (processedSize !== batch.length) {
      throw new Error(
        `${batch.length - processedSize} of ${batch.length} batch records were lost somehow.`,
      );
    }
    return processedSize;
  }
  const results = await typesense
    .collections(collectionName)
    .documents()
    .import(batch, { action: 'upsert' });
  let failsNumber = 0;
  for (const result of results) {
    if (result.success === false) {
      console.log(result);
      console.error(`Failed to import batch: ${result.error}`);
      failsNumber += 1;
    }
  }
  if (failsNumber > 0) {
    throw new Error(`Failed to import ${failsNumber} records.`);
  }

  return batch.length;
}
