import _ from 'lodash';
import type { HTTPError } from 'typesense/lib/Typesense/Errors';

import type { RowForImport } from './types';
import typesense from './typesense';

export default async function importBatch(
  collectionName: string,
  batch: RowForImport[],
) {
  try {
    await typesense
      .collections(collectionName)
      .documents()
      .import(batch, { action: 'upsert' });
  } catch (error) {
    console.error(error);
    if ((error as HTTPError).httpStatus === 413) {
      const chunks = _.chunk(batch, Math.trunc(batch.length / 2));
      for (const chunk of chunks) {
        await importBatch(collectionName, chunk);
      }
    }
  }
}
