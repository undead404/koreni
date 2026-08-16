import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTranscriptionRows } from './use-transcription-rows';

const STUB_UUID = '00000000-0000-4000-8000-000000000000';

vi.stubGlobal('crypto', {
  randomUUID: () => STUB_UUID,
});

vi.stubGlobal(
  'fetch',
  vi.fn(() => Promise.resolve({ ok: true })),
);

vi.mock('../../api/get-project-image', () => ({
  default: vi.fn(),
}));

import getProjectImage from '../../api/get-project-image';

const mockGetProjectImage = vi.mocked(getProjectImage);

function makeImage(transcription: string | null | undefined) {
  return {
    id: 'image-1',
    projectId: 'project-1',
    storageKey: 'key',
    url: 'https://example.com/img.jpg',
    pageSequence: 1,
    pageName: null,
    height: 100,
    width: 100,
    createdAt: 0,
    blurhash: 'abc',
    transcription,
  };
}

describe('useTranscriptionRows', () => {
  const mockColumns = [
    { id: 'col1', title: 'Col 1', hint: '', expectedType: 'string' as const },
  ];

  it('initializes with an empty row', async () => {
    mockGetProjectImage.mockResolvedValue(makeImage(null));

    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    await waitFor(() =>
      { expect(result.current.rows[0]).toEqual({ id: STUB_UUID, col1: '' }); },
    );
    expect(result.current.rows).toHaveLength(1);
  });

  it('adds a row', async () => {
    mockGetProjectImage.mockResolvedValue(makeImage(null));

    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    await waitFor(() => { expect(result.current.isHydrating).toBe(false); });

    act(() => {
      result.current.addRow();
    });

    expect(result.current.rows).toHaveLength(2);
  });

  it('updates a row', async () => {
    mockGetProjectImage.mockResolvedValue(makeImage(null));

    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    await waitFor(() => { expect(result.current.isHydrating).toBe(false); });

    act(() => {
      result.current.updateRow(STUB_UUID, 'col1', 'new value');
    });

    expect(result.current.rows[0].col1).toBe('new value');
  });

  it('deletes a row', async () => {
    mockGetProjectImage.mockResolvedValue(makeImage(null));

    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    await waitFor(() => { expect(result.current.isHydrating).toBe(false); });

    act(() => {
      result.current.deleteRow(STUB_UUID);
    });

    expect(result.current.rows).toHaveLength(0);
  });

  it('triggers auto-save on interval', async () => {
    vi.useFakeTimers();
    mockGetProjectImage.mockResolvedValue(makeImage(null));

    const fetchMock = vi.mocked(globalThis.fetch);

    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.updateRow(STUB_UUID, 'col1', 'changed');
    });

    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(fetchMock).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('hydrates rows from valid transcription JSON', async () => {
    const SAVED_UUID = '550e8400-e29b-41d4-a716-446655440000';
    const savedTranscription = JSON.stringify([
      { id: SAVED_UUID, col1: 'foo' },
    ]);
    mockGetProjectImage.mockResolvedValue(makeImage(savedTranscription));

    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    await waitFor(() =>
      { expect(result.current.rows).toEqual([{ id: SAVED_UUID, col1: 'foo' }]); },
    );
  });

  it('falls back to empty row when transcription is null', async () => {
    mockGetProjectImage.mockResolvedValue(makeImage(null));

    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    await waitFor(() =>
      { expect(result.current.rows).toEqual([{ id: STUB_UUID, col1: '' }]); },
    );
  });

  it('falls back to empty row when transcription is malformed JSON', async () => {
    mockGetProjectImage.mockResolvedValue(makeImage('not-json'));

    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    await waitFor(() =>
      { expect(result.current.rows).toEqual([{ id: STUB_UUID, col1: '' }]); },
    );
  });

  it('falls back to empty row when transcription JSON fails Zod schema', async () => {
    // Valid JSON but wrong shape: missing required column key, id is not a UUID
    const badTranscription = JSON.stringify([{ id: 'not-a-uuid', wrong: 'x' }]);
    mockGetProjectImage.mockResolvedValue(makeImage(badTranscription));

    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    await waitFor(() =>
      { expect(result.current.rows).toEqual([{ id: STUB_UUID, col1: '' }]); },
    );
  });

  it('does not fire auto-save immediately after hydration', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockClear();

    const SAVED_UUID = '550e8400-e29b-41d4-a716-446655440000';
    const savedTranscription = JSON.stringify([
      { id: SAVED_UUID, col1: 'bar' },
    ]);
    mockGetProjectImage.mockResolvedValue(makeImage(savedTranscription));

    renderHook(() => useTranscriptionRows(mockColumns, 'project-1', 'image-1'));

    // Let the hydration promise resolve
    await act(async () => {
      await Promise.resolve();
    });

    // Advance 2 minutes — no changes since hydration, so no PATCH
    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('sets isHydrating to true during fetch and false after', async () => {
    let resolveImage!: (value: ReturnType<typeof makeImage>) => void;
    const imagePromise = new Promise<ReturnType<typeof makeImage>>(
      (resolve) => {
        resolveImage = resolve;
      },
    );
    mockGetProjectImage.mockReturnValue(imagePromise);

    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    expect(result.current.isHydrating).toBe(true);

    await act(async () => {
      resolveImage(makeImage(null));
      await imagePromise;
    });

    expect(result.current.isHydrating).toBe(false);
  });
});
