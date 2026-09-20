import { projectDetailsResponseSchema } from '../schemata';

import requestApi from './request';

export default async function getProject(
  projectId: string,
  signal?: AbortSignal,
): Promise<ReturnType<typeof projectDetailsResponseSchema.parse>> {
  const response = await requestApi(`/api/transcribe/projects/${projectId}`, {
    signal,
  });
  const data: unknown = await response.json();
  return projectDetailsResponseSchema.parse(data);
}
