import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import environment from '@/app/environment';

import getDefaultValues from './default-values';
import type { ContributeFormValues } from './types';
import { useIdAvailability } from './use-id-availability';
const endpoint = new URL(
  '/api/submissions/id-availability',
  environment.NEXT_PUBLIC_API_SITE,
).href;
const server = setupServer();
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});
function harness() {
  const form = renderHook(() =>
    useForm<ContributeFormValues>({ defaultValues: getDefaultValues() }),
  ).result.current;
  function Wrapper({ children }: { children: ReactNode }) {
    return <FormProvider {...form}>{children}</FormProvider>;
  }
  return {
    form,
    ...renderHook(() => useIdAvailability(), { wrapper: Wrapper }),
  };
}
describe('live ID availability', () => {
  it('debounces rapid typing and checks programmatic autofill', async () => {
    const seen: string[] = [];
    server.use(
      http.get(endpoint, ({ request }) => {
        const id = new URL(request.url).searchParams.get('id');
        seen.push(id ?? '');
        return HttpResponse.json({ id, available: true });
      }),
    );
    const { form, result } = harness();
    act(() => {
      form.setValue('id', 'first-id');
      form.setValue('id', 'final-id');
    });
    expect(result.current.state.status).toBe('checking');
    expect(seen).toStrictEqual([]);
    await waitFor(() => {
      expect(result.current.state.status).toBe('available');
    });
    expect(seen).toStrictEqual(['final-id']);
    act(() => {
      form.setValue('id', '!');
    });
    expect(result.current.state.status).toBe('idle');
    act(() => {
      form.reset(getDefaultValues());
    });
    expect(result.current.state.status).toBe('idle');
  });
  it('supports retry after failure and keeps typing debounced after retry', async () => {
    let isFailing = true;
    const seen: string[] = [];
    server.use(
      http.get(endpoint, ({ request }) => {
        const id = new URL(request.url).searchParams.get('id');
        seen.push(id ?? '');
        return isFailing
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json({ id, available: false });
      }),
    );
    const { form, result } = harness();
    act(() => {
      form.setValue('id', 'example');
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe('unavailable');
    });
    isFailing = false;
    act(() => {
      result.current.retry();
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe('taken');
    });
    act(() => {
      form.setValue('id', 'another');
    });
    expect(seen).toStrictEqual(['example', 'example']);
    await waitFor(() => {
      expect(result.current.state.id).toBe('another');
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe('taken');
    });
  });
  it('ignores delayed A results across A → B → A and unmount', async () => {
    const { promise: delayed, resolve: release } =
      Promise.withResolvers<undefined>();
    let calls = 0;
    server.use(
      http.get(endpoint, async ({ request }) => {
        const id = new URL(request.url).searchParams.get('id');
        calls++;
        if (calls === 1) {
          await delayed;
          return HttpResponse.json({ id, available: true });
        }
        return HttpResponse.json({ id, available: false });
      }),
    );
    const { form, result, unmount } = harness();
    act(() => {
      form.setValue('id', 'example');
    });
    await waitFor(() => {
      expect(calls).toBe(1);
    });
    act(() => {
      form.setValue('id', 'another');
    });
    act(() => {
      form.setValue('id', 'example');
    });
    expect(result.current.state.status).toBe('checking');
    await waitFor(() => {
      expect(result.current.state.status).toBe('taken');
    });
    act(() => {
      release(undefined);
    });
    expect(result.current.state.status).toBe('taken');
    act(() => {
      form.setValue('id', 'unmount-id');
    });
    unmount();
    expect(calls).toBe(2);
  });
});
