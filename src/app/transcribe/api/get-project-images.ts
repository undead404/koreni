import { projectImagesResponseSchema } from '../schemata';

import requestApi from './request';

export default async function getProjectImages(
  projectId: string,
  signal?: AbortSignal,
) {
  return requestApi(`/api/transcribe/project/${projectId}/images`, { signal })
    .then((response) => response.json())
    .then((data: unknown) => {
      const parsed = projectImagesResponseSchema.parse(data);
      return parsed.images;
    });
}
