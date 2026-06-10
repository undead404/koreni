import { calculateBlurhash } from '../helpers/calculate-blurhash';
import {
  type ProjectImageSourceResponse,
  projectImageSourceResponseSchema,
} from '../schemata';

import requestApi from './request';

export default async function saveImageSource(
  projectId: string,
  sourceId: string,
  pageId: string,
  file: File,
  pageSequence: number,
  signal?: AbortSignal,
): Promise<ProjectImageSourceResponse> {
  const blurhash = await calculateBlurhash(file);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('blurhash', blurhash);
  formData.append('pageSequence', pageSequence.toString());
  formData.append('pageId', pageId);

  const response = await requestApi(
    `/api/transcribe/projects/${projectId}/image-sources/${sourceId}`,
    {
      method: 'PUT',
      body: formData,
      signal,
    },
  );

  const json: unknown = await response.json();
  return projectImageSourceResponseSchema.parse(json);
}
