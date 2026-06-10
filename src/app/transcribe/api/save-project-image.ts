import { calculateBlurhash } from '../helpers/calculate-blurhash';

import requestApi from './request';

export default async function saveProjectImage(
  projectId: string,
  imageId: string,
  imageFile: File,
  pageSequence: number,
  signal: AbortSignal,
) {
  const blurhash = await calculateBlurhash(imageFile);

  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('pageSequence', pageSequence.toString());
  formData.append('blurhash', blurhash);

  await requestApi(`/api/transcribe/projects/${projectId}/images/${imageId}`, {
    method: 'PUT',
    body: formData,
    signal,
  });
}
