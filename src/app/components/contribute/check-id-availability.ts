import environment from '@/app/environment';
import { idAvailabilityResponseSchema } from '@/app/schemas/api';

export type IdAvailabilityResult =
  | { status: 'available'; id: string }
  | { status: 'taken'; id: string }
  | { status: 'unavailable'; id: string }
  | { status: 'cancelled'; id: string };

export const takenIdMessage = 'Цей ідентифікатор уже зайнятий. Виберіть інший.';

export async function checkIdAvailability(
  id: string,
  signal?: AbortSignal,
): Promise<IdAvailabilityResult> {
  try {
    const url = new URL(
      '/api/submissions/id-availability',
      environment.NEXT_PUBLIC_API_SITE,
    );
    url.searchParams.set('id', id);
    const timeout = AbortSignal.timeout(5000);
    const response = await fetch(url, {
      cache: 'no-store',
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!response.ok) return { status: 'unavailable', id };
    const body: unknown = await response.json();
    const parsed = idAvailabilityResponseSchema.safeParse(body);
    if (!parsed.success || parsed.data.id !== id)
      return { status: 'unavailable', id };
    return { status: parsed.data.available ? 'available' : 'taken', id };
  } catch {
    return { status: signal?.aborted ? 'cancelled' : 'unavailable', id };
  }
}
