import _ from 'lodash';
import type { HTTPError } from 'typesense/lib/Typesense/Errors';

import type { RowForImport } from './types';
import typesense from './typesense';

export default async function importBatch(
  collectionName: string,
  batch: RowForImport[],
) {
  console.log(`importBatch for `);
  try {
    await typesense
      .collections(collectionName)
      .documents()
      .import(batch, { action: 'upsert' });
    return batch.length;
  } catch (error) {
    let processedSize = 0;
    console.error(error);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    console.log((error as any)['httpStatus']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    console.log(Object.keys(error as any));
    if ((error as HTTPError).httpStatus === 413) {
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
    } else {
      throw error;
    }
  }
}
