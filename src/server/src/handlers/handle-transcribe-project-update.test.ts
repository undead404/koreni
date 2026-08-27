import { beforeEach, describe, expect, it, vi } from 'vitest';

import updateProject from '../database/update-project.js';
import type { TranscribeContext } from '../types.js';

import handleTranscribeProjectUpdate from './handle-transcribe-project-update.js';

vi.mock('../database/update-project.js', () => ({
  default: vi.fn(),
}));

describe('handleTranscribeProjectUpdate', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      var: {
        userId: 'user-123',
      },
      req: {
        param: vi.fn((key) => {
          if (key === 'projectId') return 'proj-123';
          return undefined;
        }),
        json: vi.fn(),
      },
      json: vi.fn((data, status) => ({ _data: data, status })),
    };
  });

  it('should return 400 if projectId is missing', async () => {
    mockContext.req.param.mockImplementation((key: string) => {
      if (key === 'projectId') return '';
      return undefined;
    });

    const response = (await handleTranscribeProjectUpdate(
      mockContext as unknown as TranscribeContext,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({ error: 'Missing projectId' });
  });

  it('should return 200 on successful project update (Happy Path)', async () => {
    const mockPayload = {
      title: 'Updated Project Title',
      type: 'table',
      isHandwritten: true,
      location: [48.9, 24.5],
      tableLocale: 'uk',
      yearsRange: [1850, 1900],
      sources: ['Source A'],
    };

    mockContext.req.json.mockResolvedValue(mockPayload);
    vi.mocked(updateProject).mockResolvedValue({
      id: 'proj-123',
      title: 'Updated Project Title',
      type: 'table',
    } as any);

    const response = (await handleTranscribeProjectUpdate(
      mockContext as unknown as TranscribeContext,
    )) as any;

    expect(response.status).toBeUndefined();
    expect(response._data).toEqual({ success: true });
    expect(updateProject).toHaveBeenCalledWith(
      'proj-123',
      'user-123',
      mockPayload,
    );
  });

  it('should return 400 with validation details on invalid payload', async () => {
    const mockInvalidPayload = {
      title: '', // empty
      type: 'invalid-type',
      isHandwritten: 'yes', // should be boolean
      location: [200, 24.5], // latitude out of range
      tableLocale: 'uk',
      yearsRange: [1400], // year too low
      sources: [],
    };

    mockContext.req.json.mockResolvedValue(mockInvalidPayload);

    const response = (await handleTranscribeProjectUpdate(
      mockContext as unknown as TranscribeContext,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data.error).toBe('Validation failed');
    expect(response._data.details).toBeDefined();
    expect(updateProject).not.toHaveBeenCalled();
  });

  it('should return 404 if the project is not found or not owned by user', async () => {
    const mockPayload = {
      title: 'Updated Project Title',
      type: 'table',
      isHandwritten: true,
      location: [48.9, 24.5],
      tableLocale: 'uk',
      yearsRange: [1850, 1900],
      sources: ['Source A'],
    };

    mockContext.req.json.mockResolvedValue(mockPayload);
    vi.mocked(updateProject).mockResolvedValue(undefined);

    const response = (await handleTranscribeProjectUpdate(
      mockContext as unknown as TranscribeContext,
    )) as any;

    expect(response.status).toBe(404);
    expect(response._data).toEqual({
      error: 'Project not found or not owned by user',
    });
  });

  it('should return 500 if database update fails', async () => {
    const mockPayload = {
      title: 'Updated Project Title',
      type: 'table',
      isHandwritten: true,
      location: [48.9, 24.5],
      tableLocale: 'uk',
      yearsRange: [1850, 1900],
      sources: ['Source A'],
    };

    mockContext.req.json.mockResolvedValue(mockPayload);
    vi.mocked(updateProject).mockRejectedValue(new Error('DB failure'));

    const response = (await handleTranscribeProjectUpdate(
      mockContext as unknown as TranscribeContext,
    )) as any;

    expect(response.status).toBe(500);
    expect(response._data).toEqual({ error: 'Internal Server Error' });
  });
});
