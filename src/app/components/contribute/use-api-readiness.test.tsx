import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
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

import useApiReadiness from './use-api-readiness';

const endpoint = new URL('/api/ready', environment.NEXT_PUBLIC_API_SITE).href;
const server = setupServer();
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => {
  server.close();
});

describe('contribution API readiness', () => {
  it('blocks retries for a minute and restores readiness on manual retry', async () => {
    let requests = 0;
    let now = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    server.use(
      http.get(endpoint, () => {
        requests += 1;
        return requests === 1
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json({ status: 'ok', checks: { github: 'ok' } });
      }),
    );
    const { result } = renderHook(() => useApiReadiness());
    expect(result.current.status).toBe('checking');
    await waitFor(() => {
      expect(result.current.status).toBe('unavailable');
    });
    expect(result.current.retrySeconds).toBe(60);
    await act(async () => {
      await result.current.checkAgain();
    });
    now += 59_999;
    await act(async () => {
      await result.current.checkAgain();
    });
    expect(requests).toBe(1);
    now += 1;
    await act(async () => {
      await result.current.checkAgain();
    });
    expect(result.current.status).toBe('ready');
    expect(requests).toBe(2);
  });

  it.each(['invalid', 'network', 'unavailable'])(
    'keeps the form unavailable for %s responses',
    async (failure) => {
      server.use(
        http.get(endpoint, () => {
          if (failure === 'network') return HttpResponse.error();
          return HttpResponse.json(
            failure === 'invalid'
              ? {}
              : {
                  status: 'unavailable',
                  checks: { github: 'unavailable' },
                },
          );
        }),
      );
      const { result } = renderHook(() => useApiReadiness());
      await waitFor(() => {
        expect(result.current.status).toBe('unavailable');
      });
    },
  );
});
