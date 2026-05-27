import { type ProjectCreatePayload } from '@/server/src/schemata';

import requestApi from './request';

export default function updateProject(
  projectId: string,
  data: Omit<ProjectCreatePayload, 'id'>,
) {
  return requestApi(`/api/transcribe/projects/${projectId}`, {
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  });
}
