import typesense from './typesense';

export default async function deleteFromTypesense(tableId: string) {
  for (const tableLocale of ['pl', 'ru', 'uk']) {
    const collectionName = `unstructured_${tableLocale}`;
    console.log(`Deleting ${tableId} from ${collectionName}`);
    await typesense
      .collections(collectionName)
      .documents()
      .delete({
        filter_by: 'table_id:' + tableId,
      });
  }
}
