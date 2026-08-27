import { beforeEach, describe, expect, it, vi } from 'vitest';

import findProject from '../database/find-project.js';
import type { TranscribeContext } from '../types.js';

import handleTranscribeProjectGet from './handle-transcribe-project-get.js';

vi.mock('../database/find-project.js', () => ({
  default: vi.fn(),
}));

describe('handleTranscribeProjectGet', () => {
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
      },
      json: vi.fn((data, status) => ({ _data: data, status })),
    };
  });

  it('should return 400 if projectId is missing', async () => {
    mockContext.req.param.mockImplementation((key: string) => {
      if (key === 'projectId') return '';
      return undefined;
    });

    const response = (await handleTranscribeProjectGet(
      mockContext as unknown as TranscribeContext,
    )) as any;

    expect(response.status).toBe(400);
    expect(response._data).toEqual({ error: 'Missing projectId' });
  });

  it('should return 200 and the mapped project data on Happy Path', async () => {
    const mockDatabaseProject = {
      id: 'proj-123',
      title: 'Test Project',
      type: 'table' as const,
      is_handwritten: 1,
      latitude: 48.9,
      longitude: 24.5,
      locale: 'uk',
      year_start: 1850,
      year_end: 1900,
      sources: JSON.stringify(['Source A', 'Source B']),
      user_id: 'user-123',
    };

    vi.mocked(findProject).mockResolvedValue(mockDatabaseProject as any);

    const response = (await handleTranscribeProjectGet(
      mockContext as unknown as TranscribeContext,
    )) as any;

    expect(response.status).toBeUndefined();
    expect(response._data).toEqual({
      success: true,
      project: {
        id: 'proj-123',
        title: 'Test Project',
        type: 'table',
        isHandwritten: true,
        location: [48.9, 24.5],
        tableLocale: 'uk',
        yearsRange: [1850, 1900],
        sources: ['Source A', 'Source B'],
      },
    });

    expect(findProject).toHaveBeenCalledWith('proj-123', 'user-123');
  });

  it('should handle single year yearsRange correctly', async () => {
    const mockDatabaseProject = {
      id: 'proj-123',
      title: 'Test Project',
      type: 'table' as const,
      is_handwritten: 0,
      latitude: 48.9,
      longitude: 24.5,
      locale: 'uk',
      year_start: 1850,
      year_end: 1850,
      sources: JSON.stringify(['Source A']),
      user_id: 'user-123',
    };

    vi.mocked(findProject).mockResolvedValue(mockDatabaseProject as any);

    const response = (await handleTranscribeProjectGet(
      mockContext as unknown as TranscribeContext,
    )) as any;

    expect(response.status).toBeUndefined();
    expect(response._data.project.yearsRange).toEqual([1850]);
    expect(response._data.project.isHandwritten).toBe(false);
  });

  it('should return 404 if project is not found or belongs to another user', async () => {
    vi.mocked(findProject).mockResolvedValue(undefined);

    const response = (await handleTranscribeProjectGet(
      mockContext as unknown as TranscribeContext,
    )) as any;

    expect(response.status).toBe(404);
    expect(response._data).toEqual({ error: 'Project not found' });
  });

  it('should return 500 if database lookup fails', async () => {
    vi.mocked(findProject).mockRejectedValue(new Error('DB failure'));

    const response = (await handleTranscribeProjectGet(
      mockContext as unknown as TranscribeContext,
    )) as any;

    expect(response.status).toBe(500);
    expect(response._data).toEqual({ error: 'Internal Server Error' });
  });
});
