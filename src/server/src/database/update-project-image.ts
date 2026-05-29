import database from './client.js';

export function updateProjectImage(
  projectId: string,
  imageId: string,
  data: {
    pageName?: string | null;
  },
) {
  const updateData: Record<string, unknown> = {};

  if (data.pageName !== undefined) {
    updateData.page_name = data.pageName;
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
    ])
    .executeTakeFirst();
}
