import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkSubmissionIdAvailability } from '../services/submission-id-availability.js';

import handler from './handle-submission-id-availability.js';
vi.mock('../services/submission-id-availability.js', () => ({
  checkSubmissionIdAvailability: vi.fn(),
}));
const service = vi.mocked(checkSubmissionIdAvailability);
const app = new Hono().get('/check', handler);
beforeEach(() => service.mockReset());
describe('availability handler', () => {
  it.each([true, false, null])('returns availability %s', async (available) => {
    service.mockResolvedValue(available);
    const response = await app.request('/check?id=example');
    expect(response.status).toBe(available === null ? 503 : 200);
    expect(await response.json()).toStrictEqual(
      available === null
        ? { error: 'availability_unavailable' }
        : { id: 'example', available },
    );
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
  it.each([
    '',
    '?id=',
    '?id=abcd',
    '?id=a.bcd',
    '?id=example&id=example',
    `?id=${'x'.repeat(129)}`,
  ])('rejects %s', async (query) => {
    const response = await app.request(`/check${query}`);
    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual({ error: 'invalid_id' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(service).not.toHaveBeenCalled();
  });
});
