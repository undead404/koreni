import { act,renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAssetManager } from './use-asset-manager';

describe('useAssetManager', () => {
  it('handles file selection', () => {
    const { result } = renderHook(() => useAssetManager('proj-1', vi.fn()));

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const event = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileSelect(event);
    });

    expect(result.current.images).toHaveLength(1);
    expect(result.current.images[0].file).toBe(file);
  });
});
