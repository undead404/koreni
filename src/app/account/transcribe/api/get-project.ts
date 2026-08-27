import { type ProjectCreatePayload } from '@/server/src/schemata';

import requestApi from './request';

export interface GetProjectResponse {
  success: boolean;
  project: ProjectCreatePayload;
}

export default async function getProject(
  projectId: string,
  signal?: AbortSignal,
): Promise<GetProjectResponse> {
  return requestApi(`/api/transcribe/projects/${projectId}`, { signal })
    .then((response) => response.json())
    .then((data: unknown) => data as GetProjectResponse);
}
