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

import { checkIdAvailability } from './check-id-availability';
const endpoint = new URL(
  '/api/submissions/id-availability',
  environment.NEXT_PUBLIC_API_SITE,
).href;
const server = setupServer();
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => {
  server.close();
});
describe('ID availability client', () => {
  it.each([true, false])(
    'parses available=%s at the API origin',
    async (available) => {
      server.use(
        http.get(endpoint, ({ request }) => {
          expect(new URL(request.url).searchParams.get('id')).toBe(
            'Example-id',
          );
          return HttpResponse.json({ id: 'Example-id', available });
        }),
      );
      expect(await checkIdAvailability('Example-id')).toStrictEqual({
        id: 'Example-id',
        status: available ? 'available' : 'taken',
      });
    },
  );
  it.each([
    {},
    { id: 'wrong-id', available: true },
    { id: 'example', available: 'true' },
  ])('rejects invalid or mismatched data %j', async (body) => {
    server.use(http.get(endpoint, () => HttpResponse.json(body)));
    expect(await checkIdAvailability('example')).toStrictEqual({
      id: 'example',
      status: 'unavailable',
    });
  });
  it.each([400, 429, 503])('handles HTTP %s', async (status) => {
    server.use(http.get(endpoint, () => new HttpResponse(null, { status })));
    expect(await checkIdAvailability('example')).toMatchObject({
      status: 'unavailable',
    });
  });
  it('handles invalid JSON and network failure', async () => {
    server.use(http.get(endpoint, () => new HttpResponse('invalid')));
    expect(await checkIdAvailability('example')).toMatchObject({
      status: 'unavailable',
    });
    server.use(http.get(endpoint, () => HttpResponse.error()));
    expect(await checkIdAvailability('example')).toMatchObject({
      status: 'unavailable',
    });
  });
  it('distinguishes caller cancellation', async () => {
    const controller = new AbortController();
    controller.abort();
    expect(
      await checkIdAvailability('example', controller.signal),
    ).toMatchObject({ status: 'cancelled' });
  });
  it('bounds requests with a timeout', async () => {
    const controller = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
    const { promise: ready, resolve: started } =
      Promise.withResolvers<undefined>();
    server.use(
      http.get(endpoint, async () => {
        started(undefined);
        await new Promise<void>((resolve) => {
          controller.signal.addEventListener('abort', () => {
            resolve();
          });
        });
        return HttpResponse.json({ id: 'example', available: true });
      }),
    );
    const pending = checkIdAvailability('example');
    await ready;
    controller.abort();
    expect(await pending).toMatchObject({ status: 'unavailable' });
  });
});
