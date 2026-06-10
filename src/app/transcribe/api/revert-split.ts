import z from 'zod';

import requestApi from './request';

const revertSplitResponseSchema = z.object({
  success: z.boolean(),
});

export default async function revertSplit(
  projectId: string,
  sourceId: string,
  signal?: AbortSignal,
): Promise<{ success: boolean }> {
  const response = await requestApi(
    `/api/transcribe/projects/${projectId}/image-sources/${sourceId}/split`,
    {
      method: 'DELETE',
      signal,
    },
  );

  const json: unknown = await response.json();
  return revertSplitResponseSchema.parse(json);
}
