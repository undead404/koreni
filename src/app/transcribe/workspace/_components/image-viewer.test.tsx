import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ImageViewer from './image-viewer';

describe('ImageViewer', () => {
  afterEach(() => {
    cleanup();
  });

  const mockProperties = {
    images: [
      {
        id: '1',
        url: 'https://example.com/image.jpg',
        pageName: '12',
        pageSequence: 1,
        storageKey: 'key',
        projectId: 'p1',
      },
    ],
    currentImageIndex: 0,
    onPreviousImage: vi.fn(),
    onNextImage: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onResetTransform: vi.fn(),
    transform: { scale: 1, x: 0, y: 0 },
    isDragging: false,
    viewerReference: { current: null },
    onMouseDown: vi.fn(),
    onMouseMove: vi.fn(),
    onMouseUp: vi.fn(),
  };

  it('renders the image with correct alt text', () => {
    render(<ImageViewer {...mockProperties} />);
    // In next/image, alt is applied to the img tag
    expect(screen.getByAltText('12')).toBeInTheDocument();
  });

  it('displays image info correctly', () => {
    render(<ImageViewer {...mockProperties} />);
    expect(screen.getByText(/12 \(1 \/ 1\)/)).toBeInTheDocument();
  });
});
