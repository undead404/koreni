import { type ProjectCreatePayload } from '@/server/src/schemata';

import requestApi from './request';

export default function createProject(data: ProjectCreatePayload) {
  return requestApi('/api/transcribe/projects', {
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
}
