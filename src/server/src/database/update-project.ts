import type { ProjectCreatePayload } from '../schemata.js';

import database from './client.js';

export default function updateProject(
  projectId: string,
  userId: string,
  projectData: Omit<ProjectCreatePayload, 'id'>,
) {
  return database
    .updateTable('projects')
    .set({
      title: projectData.title,
      type: projectData.type,
      is_handwritten: projectData.isHandwritten ? 1 : 0,
      latitude: projectData.location[0],
      longitude: projectData.location[1],
      locale: projectData.tableLocale,
      sources: JSON.stringify(projectData.sources),
      year_start: projectData.yearsRange[0],
      year_end: projectData.yearsRange[1] ?? projectData.yearsRange[0],
    })
    .where('id', '=', projectId)
    .where('user_id', '=', userId)
    .returning(['id', 'title', 'type'])
    .executeTakeFirst();
}
