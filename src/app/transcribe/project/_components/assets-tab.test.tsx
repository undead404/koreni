import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AssetsTab from './assets-tab';

describe('AssetsTab', () => {
  const mockImages = [
    {
      id: '1',
      file: new File([], 'test.jpg', { type: 'image/jpeg' }),
      previewUrl: 'blob:test',
      removed: false,
      status: 'pending' as const,
    },
  ];

  it('renders upload button when idle', () => {
    render(
      <AssetsTab
        images={[]}
        uploadState="idle"
        fileInputReference={{ current: null }}
        handleFileSelect={vi.fn()}
        toggleRemove={vi.fn()}
        startUpload={vi.fn()}
        cancelUpload={vi.fn()}
      />,
    );
    expect(screen.getByText('Select Images')).toBeInTheDocument();
  });

  it('renders images in grid', () => {
    render(
      <AssetsTab
        images={mockImages}
        uploadState="idle"
        fileInputReference={{ current: null }}
        handleFileSelect={vi.fn()}
        toggleRemove={vi.fn()}
        startUpload={vi.fn()}
        cancelUpload={vi.fn()}
      />,
    );
    expect(screen.getByAltText('test.jpg')).toBeInTheDocument();
  });
});
