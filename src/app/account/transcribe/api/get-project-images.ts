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
  return parsed.images;
}
