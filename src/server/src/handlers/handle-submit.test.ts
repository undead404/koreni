import type { Context } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import getClientIdentifier from '../helpers/get-client-identifier.js';
import submitToGithub from '../services/github.js';
import posthog from '../services/posthog.js';

import handleSubmit from './handle-submit.js';

// Mock dependencies
vi.mock('../helpers/get-client-identifier.js', () => ({
  default: vi.fn(),
}));

vi.mock('../services/github.js', () => ({
  default: vi.fn(),
}));

vi.mock('../services/posthog.js', () => ({
  default: {
    capture: vi.fn(),
    captureException: vi.fn(),
  },
}));

describe('handleSubmit', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock context
    mockContext = {
      req: {
        json: vi.fn(),
        header: vi.fn(),
      },
      json: vi.fn((data, status) => ({ _data: data, status })),
    };

    vi.mocked(getClientIdentifier).mockReturnValue('mock-client-id');
  });

  it('should return 400 if payload validation fails', async () => {
    // Provide invalid payload (missing required fields)
    mockContext.req.json.mockResolvedValue({ invalid: 'data' });
    mockContext.req.header.mockReturnValue(undefined);

    const response = await handleSubmit(mockContext as Context);

    expect(response.status).toBe(400);
    expect(response._data).toHaveProperty('error');
    expect(posthog.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'payload_validation_failed',
        distinctId: 'mock-client-id',
      }),
    );
    expect(submitToGithub).not.toHaveBeenCalled();
  });

  it('should return 200 and create PR on successful submission', async () => {
    const validPayload = {
      archiveItems: ['ДАКО-1-1-1'],
      author: 'John Doe <john.doe@example.com>',
      date: '2024-06-01T12:00:00Z',
      id: 'DAKO-1-1-Ivanivka',
      tableFilename: 'ivanivka.csv',
      location: [50.4501, 30.5234],
      records: [{ year: 1990, value: 100 }],
      sources: ['https://example.com/source1'],
      title: 'Sample Data Submission',
      tableLocale: 'pl',
      yearsRange: [1990, 2020],
    };

    mockContext.req.json.mockResolvedValue(validPayload);
    mockContext.req.header.mockReturnValue('fake-api-key');

    vi.mocked(submitToGithub).mockResolvedValue({
      html_url: 'https://github.com/pr/1',
    } as any);

    const response = await handleSubmit(mockContext as Context);

    expect(response.status).toBeUndefined(); // c.json default status is 200/undefined in mock
    expect(response._data).toEqual({
      success: true,
      message: 'PR created successfully',
      url: 'https://github.com/pr/1',
    });
    expect(submitToGithub).toHaveBeenCalledWith(validPayload);
    expect(posthog.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'pr_creation_triggered',
        distinctId: 'mock-client-id',
        properties: { authMethod: 'api_key' },
      }),
    );
  });

  it('should return 502 if GitHub submission fails', async () => {
    const validPayload = {
      archiveItems: ['ДАКО-1-1-1'],
      author: 'John Doe <john.doe@example.com>',
      date: '2024-06-01T12:00:00Z',
      id: 'DAKO-1-1-Ivanivka',
      tableFilename: 'ivanivka.csv',
      location: [50.4501, 30.5234],
      records: [{ year: 1990, value: 100 }],
      sources: ['https://example.com/source1'],
      title: 'Sample Data Submission',
      tableLocale: 'pl',
      yearsRange: [1990, 2020],
    };

    mockContext.req.json.mockResolvedValue(validPayload);

    const githubError = new Error('GitHub API down');
    vi.mocked(submitToGithub).mockRejectedValue(githubError);

    const response = await handleSubmit(mockContext as Context);

    expect(response.status).toBe(502);
    expect(response._data).toHaveProperty('error');
    expect(posthog.captureException).toHaveBeenCalledWith(githubError);
  });

  it('should return 500 if an unexpected error occurs (e.g., JSON parsing fails)', async () => {
    const parseError = new Error('Invalid JSON');
    mockContext.req.json.mockRejectedValue(parseError);

    const response = await handleSubmit(mockContext as Context);

    expect(response.status).toBe(500);
    expect(response._data).toEqual({ error: 'Internal Server Error' });
    expect(posthog.captureException).toHaveBeenCalledWith(parseError);
  });
});
