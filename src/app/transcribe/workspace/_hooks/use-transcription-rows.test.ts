import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTranscriptionRows } from './use-transcription-rows';

vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid',
});

vi.stubGlobal(
  'fetch',
  vi.fn(() => Promise.resolve({ ok: true })),
);

describe('useTranscriptionRows', () => {
  const mockColumns = [
    { id: 'col1', title: 'Col 1', hint: '', expectedType: 'string' as const },
  ];

  it('initializes with an empty row', () => {
    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0]).toEqual({
      id: 'test-uuid',
      col1: '',
    });
  });

  it('adds a row', () => {
    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    act(() => {
      result.current.addRow();
    });

    expect(result.current.rows).toHaveLength(2);
  });

  it('updates a row', () => {
    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    act(() => {
      result.current.updateRow('test-uuid', 'col1', 'new value');
    });

    expect(result.current.rows[0].col1).toBe('new value');
  });

  it('deletes a row', () => {
    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    act(() => {
      result.current.deleteRow('test-uuid');
    });

    expect(result.current.rows).toHaveLength(0);
  });

  it('triggers auto-save on interval', () => {
    vi.useFakeTimers();
    const fetchMock = vi.mocked(globalThis.fetch);

    renderHook(() => useTranscriptionRows(mockColumns, 'project-1', 'image-1'));

    // Initial state is saved? No, only on change.
    // Wait, lastSavedReference is empty, so if we wait 2 mins it should NOT save if no changes.

    // Change rows
    const { result } = renderHook(() =>
      useTranscriptionRows(mockColumns, 'project-1', 'image-1'),
    );

    act(() => {
      result.current.updateRow('test-uuid', 'col1', 'changed');
    });

    // Advance time by 2 minutes
    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(fetchMock).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
