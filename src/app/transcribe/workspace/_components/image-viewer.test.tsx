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
        cropX: null,
        side: null,
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
    cropX: null,
    side: null,
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

  it('renders full image when side is null', () => {
    render(<ImageViewer {...mockProperties} cropX={null} side={null} />);
    expect(screen.getByAltText('12')).toBeInTheDocument();
  });

  it('renders cropped image when side is left', () => {
    const propertiesWithCrop = {
      ...mockProperties,
      images: [
        {
          ...mockProperties.images[0],
          width: 800,
          height: 600,
        },
      ],
      cropX: 0.5,
      side: 'left' as const,
    };
    render(<ImageViewer {...propertiesWithCrop} />);
    expect(screen.getByAltText('12')).toBeInTheDocument();
  });

  it('renders cropped image when side is right', () => {
    const propertiesWithCrop = {
      ...mockProperties,
      images: [
        {
          ...mockProperties.images[0],
          width: 800,
          height: 600,
        },
      ],
      cropX: 0.5,
      side: 'right' as const,
    };
    render(<ImageViewer {...propertiesWithCrop} />);
    expect(screen.getByAltText('12')).toBeInTheDocument();
  });

  it('falls back to full image when width or height is missing', () => {
    const propertiesWithoutDimensions = {
      ...mockProperties,
      cropX: 0.5,
      side: 'left' as const,
    };
    render(<ImageViewer {...propertiesWithoutDimensions} />);
    expect(screen.getByAltText('12')).toBeInTheDocument();
  });
});
