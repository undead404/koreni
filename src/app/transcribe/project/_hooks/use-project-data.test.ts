import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, Mock,vi } from 'vitest';

import getProject from '../../api/get-project';
import getProjectImages from '../../api/get-project-images';

import { useProjectData } from './use-project-data';

vi.mock('../../api/get-project', () => ({
  default: vi.fn(),
}));
vi.mock('../../api/get-project-images', () => ({
  default: vi.fn(),
}));

describe('useProjectData', () => {
  it('loads project data and images count', async () => {
    const reset = vi.fn();
    const mockProject = { id: '1', title: 'T' };
    (getProject as Mock).mockResolvedValue({
      success: true,
      project: mockProject,
    });
    (getProjectImages as Mock).mockResolvedValue([{ id: 'img1' }]);

    const { result } = renderHook(() => useProjectData('1', reset));

    await waitFor(() => {
      expect(result.current.projectData).toEqual(mockProject);
      expect(result.current.existingImagesCount).toBe(1);
      expect(reset).toHaveBeenCalledWith(mockProject);
    });
  });
});
