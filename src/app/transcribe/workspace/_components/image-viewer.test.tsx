import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ImageViewer from './image-viewer';

describe('ImageViewer', () => {
  afterEach(() => {
    cleanup();
  });

  const baseImage = {
    id: '1',
    url: 'https://example.com/image.jpg',
    pageName: '12',
    pageSequence: 1,
    storageKey: 'key',
    projectId: 'p1',
    width: 1200,
    height: 800,
    cropX: null,
    side: null,
  };

  const mockProperties = {
    images: [baseImage],
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

  describe('virtual crop rendering', () => {
    it('non-split image — no clip-path applied', () => {
      const { container } = render(
        <ImageViewer {...mockProperties} cropX={null} side={null} />,
      );
      const img = screen.getByAltText('12');
      expect(img.style.clipPath).toBe('');
      expect(container.querySelector('.cropContainer')).not.toBeInTheDocument();
    });

    it('left split — correct clip-path', () => {
      const propertiesWithCrop = {
        ...mockProperties,
        images: [
          {
            ...baseImage,
            width: 1200,
            height: 800,
          },
        ],
        cropX: 0.6,
        side: 'left' as const,
      };
      const { container } = render(<ImageViewer {...propertiesWithCrop} />);
      const img = screen.getByAltText('12');
      expect(img).toHaveStyle({ clipPath: 'inset(0 40% 0 0)' });
      expect(container.querySelector('.cropContainer')).not.toBeInTheDocument();
    });

    it('right split — correct clip-path', () => {
      const propertiesWithCrop = {
        ...mockProperties,
        images: [
          {
            ...baseImage,
            width: 1200,
            height: 800,
          },
        ],
        cropX: 0.6,
        side: 'right' as const,
      };
      const { container } = render(<ImageViewer {...propertiesWithCrop} />);
      const img = screen.getByAltText('12');
      expect(img).toHaveStyle({ clipPath: 'inset(0 0 0 60%)' });
      expect(container.querySelector('.cropContainer')).not.toBeInTheDocument();
    });

    it('cropX === 0.5 — symmetric split (left)', () => {
      const propertiesWithCrop = {
        ...mockProperties,
        images: [
          {
            ...baseImage,
            width: 1200,
            height: 800,
          },
        ],
        cropX: 0.5,
        side: 'left' as const,
      };
      const img = render(
        <ImageViewer {...propertiesWithCrop} />,
      ).container.querySelector('img');
      expect(img).toHaveStyle({ clipPath: 'inset(0 50% 0 0)' });
    });

    it('cropX === 0.5 — symmetric split (right)', () => {
      const propertiesWithCrop = {
        ...mockProperties,
        images: [
          {
            ...baseImage,
            width: 1200,
            height: 800,
          },
        ],
        cropX: 0.5,
        side: 'right' as const,
      };
      const img = render(
        <ImageViewer {...propertiesWithCrop} />,
      ).container.querySelector('img');
      expect(img).toHaveStyle({ clipPath: 'inset(0 0 0 50%)' });
    });

    it('guard: side non-null but cropX null — falls back to full image', () => {
      const propertiesWithoutCropX = {
        ...mockProperties,
        images: [
          {
            ...baseImage,
            width: 1200,
            height: 800,
          },
        ],
        cropX: null,
        side: 'left' as const,
      };
      const img = render(
        <ImageViewer {...propertiesWithoutCropX} />,
      ).container.querySelector('img');
      expect(img?.style.clipPath).toBe('');
    });

    it('guard: side non-null but image width is null — falls back to full image', () => {
      const propertiesWithoutWidth = {
        ...mockProperties,
        images: [
          {
            ...baseImage,
            width: null,
            height: 800,
          },
        ],
        cropX: 0.5,
        side: 'left' as const,
      };
      const img = render(
        <ImageViewer {...propertiesWithoutWidth} />,
      ).container.querySelector('img');
      expect(img?.style.clipPath).toBe('');
    });

    it('guard: side non-null but image height is null — falls back to full image', () => {
      const propertiesWithoutHeight = {
        ...mockProperties,
        images: [
          {
            ...baseImage,
            width: 1200,
            height: null,
          },
        ],
        cropX: 0.5,
        side: 'left' as const,
      };
      const img = render(
        <ImageViewer {...propertiesWithoutHeight} />,
      ).container.querySelector('img');
      expect(img?.style.clipPath).toBe('');
    });

    it('transform is applied in non-crop branch', () => {
      const propertiesWithTransform = {
        ...mockProperties,
        transform: { scale: 2, x: 10, y: -5 },
        cropX: null,
        side: null,
      };
      const img = render(
        <ImageViewer {...propertiesWithTransform} />,
      ).container.querySelector('img');
      expect(img).toHaveStyle({
        transform: 'translate(10px, -5px) scale(2)',
      });
    });

    it('transform is applied in crop branch', () => {
      const propertiesWithTransform = {
        ...mockProperties,
        images: [
          {
            ...baseImage,
            width: 1200,
            height: 800,
          },
        ],
        transform: { scale: 2, x: 10, y: -5 },
        cropX: 0.5,
        side: 'left' as const,
      };
      const img = render(
        <ImageViewer {...propertiesWithTransform} />,
      ).container.querySelector('img');
      expect(img).toHaveStyle({
        transform: 'translate(10px, -5px) scale(2)',
      });
    });

    it('cropContainer CSS class is not present in any rendered output', () => {
      const { container: container1 } = render(
        <ImageViewer {...mockProperties} cropX={null} side={null} />,
      );
      expect(
        container1.querySelector('.cropContainer'),
      ).not.toBeInTheDocument();

      const { container: container2 } = render(
        <ImageViewer
          {...mockProperties}
          images={[{ ...baseImage, width: 1200, height: 800 }]}
          cropX={0.5}
          side="left"
        />,
      );
      expect(
        container2.querySelector('.cropContainer'),
      ).not.toBeInTheDocument();
    });
  });
});
