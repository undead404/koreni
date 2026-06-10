import database from './client.js';

export function deleteProjectImage(projectId: string, imageId: string) {
  return database
    .deleteFrom('project_images')
    .where('id', '=', imageId)
    .where('project_id', '=', projectId)
    .execute();
}
