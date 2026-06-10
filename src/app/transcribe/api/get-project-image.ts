import z from 'zod';

import type { ProjectImage } from '../schemata';
import { projectImageSchema } from '../schemata';

import requestApi from './request';

const projectImageResponseSchema = z.object({
  success: z.boolean(),
  image: projectImageSchema,
});

export default async function getProjectImage(
  projectId: string,
  imageId: string,
  signal?: AbortSignal,
): Promise<ProjectImage> {
  return requestApi(`/api/transcribe/projects/${projectId}/images/${imageId}`, {
    signal,
  })
    .then((response) => response.json())
    .then((data: unknown) => {
      const parsed = projectImageResponseSchema.parse(data);
      return parsed.image;
    });
}
