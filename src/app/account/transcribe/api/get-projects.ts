import { projectResponseSchema } from '../schemata';

import requestApi from './request';

export default async function getProjects() {
  const response = await requestApi('/api/transcribe/projects');
  const data: unknown = await response.json();
  const projectsData = projectResponseSchema.parse(data);
  return projectsData.projects;
}
