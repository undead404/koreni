import { projectResponseSchema } from '../schemata';

import requestApi from './request';

export default async function getProjects() {
  return requestApi('/api/transcribe/projects')
    .then((response) => response.json())
    .then((data: unknown) => {
      const projectsData = projectResponseSchema.parse(data);
      return projectsData.projects;
    });
}
