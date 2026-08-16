import {
  type SpreadSplitResponse,
  spreadSplitResponseSchema,
} from '../schemata';

import requestApi from './request';

interface SpreadSplitPayload {
  cropX: number;
  leftPageId: string;
  rightPageId: string;
  leftPageSequence: number;
  rightPageSequence: number;
  leftPageName?: string | null;
  rightPageName?: string | null;
}

export default async function splitSpread(
  projectId: string,
  sourceId: string,
  payload: SpreadSplitPayload,
  signal?: AbortSignal,
): Promise<SpreadSplitResponse> {
  const response = await requestApi(
    `/api/transcribe/projects/${projectId}/image-sources/${sourceId}/split`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId, ...payload }),
      signal,
    },
  );

  const json: unknown = await response.json();
  return spreadSplitResponseSchema.parse(json);
}
