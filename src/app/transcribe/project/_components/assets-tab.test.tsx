import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ImageFile } from '../types';

import AssetsTab from './assets-tab';

const baseProperties = {
  uploadState: 'idle' as const,
  fileInputReference: { current: null },
  handleFileSelect: vi.fn(),
  toggleRemove: vi.fn(),
  startUpload: vi.fn(),
  cancelUpload: vi.fn(),
  onSplitConfirm: vi.fn(),
  onRevertSplit: vi.fn(),
};

const makeImage = (overrides: Partial<ImageFile> = {}): ImageFile => ({
  id: '1',
  file: new File([], 'test.jpg', { type: 'image/jpeg' }),
  previewUrl: 'blob:test',
  removed: false,
  status: 'pending',
  sourceId: 'source-1',
  isSplit: false,
  splitCropX: null,
  ...overrides,
});

describe('AssetsTab', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders upload button when idle with no images', () => {
    render(<AssetsTab {...baseProperties} images={[]} />);
    expect(screen.getByText('Select Images')).toBeInTheDocument();
  });

  it('renders images in grid', () => {
    render(<AssetsTab {...baseProperties} images={[makeImage()]} />);
    expect(screen.getByAltText('test.jpg')).toBeInTheDocument();
  });

  it('shows split button for successfully uploaded image', () => {
    render(
      <AssetsTab
        {...baseProperties}
        images={[makeImage({ status: 'success' })]}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Розділити розворот' }),
    ).toBeInTheDocument();
  });

  it('shows revert button for a split image', () => {
    render(
      <AssetsTab
        {...baseProperties}
        images={[
          makeImage({ status: 'success', isSplit: true, splitCropX: 0.5 }),
        ]}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Скасувати розділення' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Розворот розділено')).toBeInTheDocument();
  });

  it('does not show split button for pending image', () => {
    render(
      <AssetsTab
        {...baseProperties}
        images={[makeImage({ status: 'pending' })]}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Розділити розворот' }),
    ).not.toBeInTheDocument();
  });

  it('does not show split controls while uploading', () => {
    render(
      <AssetsTab
        {...baseProperties}
        uploadState="uploading"
        images={[makeImage({ status: 'success' })]}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Розділити розворот' }),
    ).not.toBeInTheDocument();
  });
});
