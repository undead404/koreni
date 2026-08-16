import { projectImagesResponseSchema } from '../schemata';

import requestApi from './request';

export interface GetProjectImagesOptions {
  withTranscription?: boolean;
}

export default async function getProjectImages(
  projectId: string,
  options?: GetProjectImagesOptions,
  signal?: AbortSignal,
) {
  const url = options?.withTranscription
    ? `/api/transcribe/projects/${projectId}/images?withTranscription=true`
    : `/api/transcribe/projects/${projectId}/images`;

  return requestApi(url, { signal })
    .then((response) => response.json())
    .then((data: unknown) => {
      const parsed = projectImagesResponseSchema.parse(data);
      return parsed.images;
    });
}
