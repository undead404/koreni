import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, Mock,vi } from 'vitest';

import getProjectSchemas from '../../api/get-project-schemas';

import { useProjectSchemas } from './use-project-schemas';

vi.mock('../../api/get-project-schemas', () => ({
  default: vi.fn(),
}));

describe('useProjectSchemas', () => {
  it('fetches schemas on mount', async () => {
    const mockSchemas = [{ enabled: true, label: 'L', value: 'v' }];
    (getProjectSchemas as Mock).mockResolvedValue(mockSchemas);

    const { result } = renderHook(() => useProjectSchemas());

    await waitFor(() => {
      expect(result.current).toEqual(mockSchemas);
    });
  });
});
