import { RequestError } from '@octokit/request-error';
import type { Context } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import handleSubmit from '../handlers/handle-submit.js';
import type { ImportPayload } from '../schemata.js';
import { importPayloadSchema } from '../schemata.js';

import submitToGithub from './github.js';
import posthog from './posthog.js';

// Hoist mock variables to the absolute top of the file before imports and mocking
const mocks = vi.hoisted(() => {
  return {
    mockGetRef: vi.fn(),
    mockGetContent: vi.fn(),
    mockGetCommit: vi.fn(),
    mockCreateBlob: vi.fn(),
    mockCreateTree: vi.fn(),
    mockCreateCommit: vi.fn(),
    mockCreateRef: vi.fn(),
    mockCreatePull: vi.fn(),
  };
});

// Mock SDK 'octokit' using a proper class representation
vi.mock('octokit', () => {
  return {
    Octokit: class OctokitMock {
      rest = {
        git: {
          getRef: mocks.mockGetRef,
          getCommit: mocks.mockGetCommit,
          createBlob: mocks.mockCreateBlob,
          createTree: mocks.mockCreateTree,
          createCommit: mocks.mockCreateCommit,
          createRef: mocks.mockCreateRef,
        },
        repos: {
          getContent: mocks.mockGetContent,
        },
        pulls: {
          create: mocks.mockCreatePull,
        },
      };
    },
  };
});

// Mock environment and telemetry with correct relative paths for src/services/
vi.mock('../environment.js', () => ({
  default: {
    GITHUB_REPO: 'owner/repo',
    GITHUB_TOKEN: 'token-123',
    BUGSNAG_API_API_KEY: 'bugsnag-key',
    POSTHOG_KEY: 'posthog-key',
    POSTHOG_HOST: 'https://app.posthog.com',
    TURNSTILE_SECRET_KEY: 'turnstile-secret',
    NEXT_PUBLIC_SITE: 'https://example.com',
    NODE_ENV: 'test',
  },
}));

vi.mock('./posthog.js', () => ({
  default: {
    capture: vi.fn(),
    captureException: vi.fn(),
  },
}));

vi.mock('../helpers/get-client-identifier.js', () => ({
  default: vi.fn(() => 'mock-client-id'),
}));

describe('GitHub Webhook Service Tests', () => {
  const validPayload: ImportPayload = {
    archiveItems: ['ДАКО-1-1-1'],
    authorName: 'John Doe',
    authorEmail: 'john.doe@example.com',
    id: 'dako-1-1-ivanivka',
    location: [50.4501, 30.5234],
    sources: ['https://example.com/source1'],
    table: {
      columns: ['year', 'value'],
      data: [{ year: 1990, value: 100 }],
    },
    title: 'Sample Data Submission',
    tableLocale: 'pl',
    yearsRange: [1990, 2020],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Webhook Payload Validation (Zod)', () => {
    it('should validate a correct payload', () => {
      const result = importPayloadSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should catch malformed payload with missing archiveItems', () => {
      const malformed = { ...validPayload, archiveItems: undefined };
      const result = importPayloadSchema.safeParse(malformed);
      expect(result.success).toBe(false);
    });

    it('should catch malformed payload with empty archiveItems', () => {
      const malformed = { ...validPayload, archiveItems: [] };
      const result = importPayloadSchema.safeParse(malformed);
      expect(result.success).toBe(false);
    });

    it('should catch malformed payload with invalid authorEmail', () => {
      const malformed = { ...validPayload, authorEmail: 'invalid-email' };
      const result = importPayloadSchema.safeParse(malformed);
      expect(result.success).toBe(false);
    });

    it('should catch malformed payload with invalid ID (illegal characters)', () => {
      const malformed = { ...validPayload, id: 'invalid_id_with_underscores!' };
      const result = importPayloadSchema.safeParse(malformed);
      expect(result.success).toBe(false);
    });

    it('should catch malformed payload with out-of-bounds latitude', () => {
      const malformed = { ...validPayload, location: [95, 30.5234] };
      const result = importPayloadSchema.safeParse(malformed);
      expect(result.success).toBe(false);
    });

    it('should catch malformed payload with out-of-bounds longitude', () => {
      const malformed = { ...validPayload, location: [50.4501, 185] };
      const result = importPayloadSchema.safeParse(malformed);
      expect(result.success).toBe(false);
    });

    it('should catch malformed payload with empty table columns', () => {
      const malformed = {
        ...validPayload,
        table: { columns: [], data: [{ year: 1990 }] },
      };
      const result = importPayloadSchema.safeParse(malformed);
      expect(result.success).toBe(false);
    });

    it('should catch malformed payload with empty table data', () => {
      const malformed = {
        ...validPayload,
        table: { columns: ['year'], data: [] },
      };
      const result = importPayloadSchema.safeParse(malformed);
      expect(result.success).toBe(false);
    });

    it('should catch malformed payload with invalid tableLocale', () => {
      const malformed = { ...validPayload, tableLocale: 'en' };
      const result = importPayloadSchema.safeParse(malformed);
      expect(result.success).toBe(false);
    });

    it('should catch malformed payload with invalid yearsRange format', () => {
      const malformed = { ...validPayload, yearsRange: [1990, 2020, 2030] };
      const result = importPayloadSchema.safeParse(malformed);
      expect(result.success).toBe(false);
    });
  });

  describe('SDK Mocking and Happy Path', () => {
    it('should successfully submit to GitHub and create pull request', async () => {
      const error404 = new RequestError('Not Found', 404, {
        request: { url: '', method: 'GET', headers: {} },
        response: { url: '', status: 404, headers: {}, data: {} },
      });

      // 1. Conflict checks (must throw 404)
      mocks.mockGetRef.mockRejectedValueOnce(error404);
      mocks.mockGetContent.mockRejectedValueOnce(error404);

      // 2. Fetch Base Branch Data
      mocks.mockGetRef.mockResolvedValueOnce({
        data: {
          object: { sha: 'main-commit-sha' },
        },
      });
      mocks.mockGetCommit.mockResolvedValueOnce({
        data: {
          tree: { sha: 'main-tree-sha' },
        },
      });

      // 3. Create Blobs (YAML and CSV)
      mocks.mockCreateBlob
        .mockResolvedValueOnce({ data: { sha: 'yaml-blob-sha' } })
        .mockResolvedValueOnce({ data: { sha: 'csv-blob-sha' } });

      // 4. Create New Tree
      mocks.mockCreateTree.mockResolvedValueOnce({
        data: { sha: 'new-tree-sha' },
      });

      // 5. Create Commit
      mocks.mockCreateCommit.mockResolvedValueOnce({
        data: { sha: 'new-commit-sha' },
      });

      // 6. Create Ref
      mocks.mockCreateRef.mockResolvedValueOnce({ data: {} });

      // 7. Open PR
      mocks.mockCreatePull.mockResolvedValueOnce({
        data: { html_url: 'https://github.com/owner/repo/pull/1' },
      });

      const result = await submitToGithub(validPayload);

      expect(result).toEqual({
        html_url: 'https://github.com/owner/repo/pull/1',
      });

      expect(mocks.mockGetRef).toHaveBeenCalledWith(
        expect.objectContaining({
          ref: 'heads/submission/dako-1-1-ivanivka',
        }),
      );
      expect(mocks.mockGetContent).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'data/records/dako-1-1-ivanivka.yaml',
        }),
      );
      expect(mocks.mockGetRef).toHaveBeenCalledWith(
        expect.objectContaining({
          ref: 'heads/main',
        }),
      );
    });

    it('should raise an error if branch already exists', async () => {
      mocks.mockGetRef.mockResolvedValueOnce({
        data: { object: { sha: 'some-sha' } },
      });

      await expect(submitToGithub(validPayload)).rejects.toThrow(
        'Branch submission/dako-1-1-ivanivka already exists.',
      );
    });

    it('should raise an error if record already exists in main branch', async () => {
      const error404 = new RequestError('Not Found', 404, {
        request: { url: '', method: 'GET', headers: {} },
        response: { url: '', status: 404, headers: {}, data: {} },
      });

      mocks.mockGetRef.mockRejectedValueOnce(error404); // branch does not exist
      mocks.mockGetContent.mockResolvedValueOnce({
        data: { sha: 'existing-content-sha' },
      }); // file exists

      await expect(submitToGithub(validPayload)).rejects.toThrow(
        'Record dako-1-1-ivanivka already exists in the main branch.',
      );
    });
  });

  describe('Unhappy Path and Telemetry', () => {
    it('should reject with a 401 Unauthorized error and verify telemetry fires', async () => {
      const error401 = new RequestError('Unauthorized', 401, {
        request: { url: '', method: 'GET', headers: {} },
        response: { url: '', status: 401, headers: {}, data: {} },
      });

      // Force Octokit client to reject with 401
      mocks.mockGetRef.mockRejectedValueOnce(error401);

      // Create a mock context for handleSubmit Hono route
      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue(validPayload),
          header: vi.fn(),
        },
        json: vi.fn((data, status) => ({ _data: data, status })),
      };

      const response = (await handleSubmit(
        mockContext as unknown as Context,
      )) as any;

      expect(response.status).toBe(502);
      expect(response._data.error).toContain('Unauthorized');

      // Verify telemetry fires via PostHog captureException
      expect(posthog.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 401,
          message: 'Unauthorized',
        }),
      );
    });
  });
});
