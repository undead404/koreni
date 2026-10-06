import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContextVariables } from '../types.js';

import {
  handleGetAuthEmailVisibility,
  handlePutAuthEmailVisibility,
} from './handle-auth-email-visibility.js';

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  findUser: vi.fn(),
  loggerError: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('../database/find-user-by-id.js', () => ({ default: mocks.findUser }));
vi.mock('../database/update-user-email-visibility.js', () => ({
  default: mocks.updateUser,
}));
vi.mock('../services/github-workflow-dispatch.js', () => ({
  default: mocks.dispatch,
}));
vi.mock('../logger.js', () => ({
  logger: { error: mocks.loggerError },
}));

function createAuthenticatedApp() {
  const app = new Hono<{ Variables: ContextVariables }>();
  app.use('*', async (context, next) => {
    context.set('userId', 'session-user-id');
    context.set('isAdmin', false);
    context.set('requestId', 'request-id');
    await next();
  });
  app.get('/visibility', handleGetAuthEmailVisibility);
  app.put('/visibility', handlePutAuthEmailVisibility);
  return app;
}

describe('authenticated email visibility handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUser.mockResolvedValue({ show_email: 1 });
    mocks.updateUser.mockResolvedValue(true);
    mocks.dispatch.mockResolvedValue(undefined);
  });

  it('returns the authenticated user preference as a boolean', async () => {
    const response = await createAuthenticatedApp().request('/visibility');

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ show_email: true });
    expect(mocks.findUser).toHaveBeenCalledWith('session-user-id');
  });

  it.each([
    ['a missing value', {}],
    ['a string value', { show_email: 'false' }],
    ['a numeric value', { show_email: 0 }],
    ['a caller identity field', { show_email: false, user_id: 'other-user' }],
  ])('rejects %s without mutation or dispatch', async (_label, body) => {
    const response = await createAuthenticatedApp().request('/visibility', {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    });

    expect(response.status).toBe(400);
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });

  it('persists before dispatching and returns queued after acceptance', async () => {
    const response = await createAuthenticatedApp().request('/visibility', {
      body: JSON.stringify({ show_email: false }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      rebuild_status: 'queued',
      show_email: false,
    });
    expect(mocks.updateUser).toHaveBeenCalledWith('session-user-id', false);
    expect(mocks.updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.dispatch.mock.invocationCallOrder[0],
    );
  });

  it('retains saved state and reports dispatch failure without private values', async () => {
    mocks.dispatch.mockRejectedValueOnce(
      new Error('token/private@example.com'),
    );

    const response = await createAuthenticatedApp().request('/visibility', {
      body: JSON.stringify({ show_email: false }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      rebuild_status: 'dispatch_failed',
      show_email: false,
    });
    expect(mocks.updateUser).toHaveBeenCalledWith('session-user-id', false);
    expect(JSON.stringify(mocks.loggerError.mock.calls)).not.toContain(
      'private@example.com',
    );
    expect(JSON.stringify(mocks.loggerError.mock.calls)).not.toContain('token');
  });

  it('dispatches again for an idempotent preference update', async () => {
    const app = createAuthenticatedApp();
    const request = () =>
      app.request('/visibility', {
        body: JSON.stringify({ show_email: true }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      });

    await request();
    await request();

    expect(mocks.updateUser).toHaveBeenCalledTimes(2);
    expect(mocks.dispatch).toHaveBeenCalledTimes(2);
  });

  it('does not dispatch when persistence fails', async () => {
    mocks.updateUser.mockRejectedValueOnce(new Error('database unavailable'));

    const response = await createAuthenticatedApp().request('/visibility', {
      body: JSON.stringify({ show_email: false }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    });

    expect(response.status).toBe(500);
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });
});
