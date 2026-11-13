import { act, cleanup, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import environment from '@/app/environment';

import getDefaultValues from './default-values';
import useContributeForm from './use-contribute-form';
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
function validValues() {
  const input = document.createElement('input');
  input.type = 'file';
  const files = input.files;
  if (!files) throw new Error('FileList missing');
  Object.defineProperty(files, 'length', { value: 1 });
  return getDefaultValues({
    id: 'example',
    title: 'Example title',
    authorName: 'Author',
    authorEmail: 'author@example.com',
    archiveItems: [{ item: 'DAKO-1' }],
    location: '50,30',
    yearsRange: [1900],
    sources: [],
    tableLocale: 'uk',
    table: files,
  });
}
describe('form availability resolver', () => {
  it.each([true, false, null])(
    'gates ID trigger and final submit for %s without ContextForm',
    async (available) => {
      let requests = 0;
      server.use(
        http.get(endpoint, ({ request }) => {
          requests++;
          return available === null
            ? new HttpResponse(null, { status: 503 })
            : HttpResponse.json({
                id: new URL(request.url).searchParams.get('id'),
                available,
              });
        }),
      );
      const { result } = renderHook(() => useContributeForm());
      act(() => {
        result.current.reset(validValues());
      });
      let isValid = false;
      await act(async () => {
        isValid = await result.current.trigger(['id']);
      });
      expect(isValid).toBe(available !== false);
      const submit = vi.fn();
      await act(async () => {
        await result.current.handleSubmit(submit)();
      });
      expect(submit).toHaveBeenCalledTimes(available === false ? 0 : 1);
      expect(requests).toBe(2);
      expect(result.current.formState.isSubmitting).toBe(false);
    },
  );
  it('preserves local validation and avoids requests for invalid IDs', async () => {
    const { result } = renderHook(() => useContributeForm());
    act(() => {
      result.current.setValue('id', 'bad!');
    });
    await act(async () => {
      expect(await result.current.trigger(['id'])).toBe(false);
    });
    expect(result.current.getFieldState('id').error?.type).not.toBe(
      'availability',
    );
  });
  it('makes a fresh final check after earlier success', async () => {
    let isAvailable = true;
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json({ id: 'example', available: isAvailable }),
      ),
    );
    const { result } = renderHook(() => useContributeForm());
    act(() => {
      result.current.reset(validValues());
    });
    await act(async () => {
      expect(await result.current.trigger('id')).toBe(true);
    });
    isAvailable = false;
    const submit = vi.fn();
    await act(async () => {
      await result.current.handleSubmit(submit)();
    });
    expect(submit).not.toHaveBeenCalled();
    expect(result.current.getFieldState('id').error?.type).toBe('availability');
    act(() => {
      result.current.setValue('id', 'another');
    });
    expect(result.current.getFieldState('id').error).toBeUndefined();
  });
  it('rechecks edited IDs before accepting validation', async () => {
    const { promise: ready, resolve: started } =
      Promise.withResolvers<undefined>();
    const { promise: delayed, resolve: release } =
      Promise.withResolvers<undefined>();
    const seen: string[] = [];
    server.use(
      http.get(endpoint, async ({ request }) => {
        const id = new URL(request.url).searchParams.get('id');
        seen.push(id ?? '');
        if (id === 'example') {
          started(undefined);
          await delayed;
        }
        return HttpResponse.json({ id, available: id === 'example' });
      }),
    );
    const { result } = renderHook(() => useContributeForm());
    act(() => {
      result.current.reset(validValues());
    });
    const submit = vi.fn();
    await act(async () => {
      const pending = result.current.handleSubmit(submit)();
      await ready;
      result.current.setValue('id', 'taken-id');
      release(undefined);
      await pending;
    });
    expect(seen).toStrictEqual(['example', 'taken-id']);
    expect(submit).not.toHaveBeenCalled();
  });
});
