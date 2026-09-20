import { projectImagesResponseSchema } from '../schemata';

import requestApi from './request';

export default async function getProjectImages(
  projectId: string,
  signal?: AbortSignal,
) {
  const response = await requestApi(
    `/api/transcribe/project/${projectId}/images`,
    { signal },
  );
  const data: unknown = await response.json();
  const parsed = projectImagesResponseSchema.parse(data);
  if (!parsed.success) {
    throw new Error('Project images failed to load');
  }
  return parsed.images;
}
