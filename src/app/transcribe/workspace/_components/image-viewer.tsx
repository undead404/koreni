import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Image from 'next/image';

import type { ProjectImage } from '../../schemata';

import styles from '../page.module.css';

interface ImageViewerProperties {
  images: ProjectImage[];
  currentImageIndex: number;
  onPreviousImage: () => void;
  onNextImage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetTransform: () => void;
  transform: { scale: number; x: number; y: number };
  isDragging: boolean;
  viewerReference: React.RefObject<HTMLDivElement | null>;
  onMouseDown: (event: React.MouseEvent) => void;
  onMouseMove: (event: React.MouseEvent) => void;
  onMouseUp: () => void;
}

export default function ImageViewer({
  images,
  currentImageIndex,
  onPreviousImage,
  onNextImage,
  onZoomIn,
  onZoomOut,
  onResetTransform,
  transform,
  isDragging,
  viewerReference,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: ImageViewerProperties) {
  return (
    <div className={styles.viewerContainer}>
      <div className={styles.viewerHeader}>
        <div className={styles.navigationControls}>
          <button
            className={styles.iconButton}
            onClick={onPreviousImage}
            disabled={currentImageIndex === 0}
            title="Previous Image"
          >
            <ChevronLeft size={18} />
          </button>
          <span className={styles.imageInfo}>
            {images[currentImageIndex]?.storageKey || 'Зображення'} (
            {currentImageIndex + 1} / {images.length})
          </span>
          <button
            className={styles.iconButton}
            onClick={onNextImage}
            disabled={currentImageIndex === images.length - 1}
            title="Next Image"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className={styles.viewerControls}>
          <button
            className={styles.iconButton}
            onClick={onZoomIn}
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            className={styles.iconButton}
            onClick={onZoomOut}
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            className={styles.iconButton}
            onClick={onResetTransform}
            title="Reset"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className={styles.imageViewer}
        ref={viewerReference}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {images[currentImageIndex] ? (
          <Image
            draggable={false}
            src={images[currentImageIndex].url}
            alt={
              images[currentImageIndex].pageName ||
              `${images[currentImageIndex].pageSequence}`
            }
            fill
            className={styles.displayImage}
            priority
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <ImageIcon size={64} className={styles.placeholderIcon} />
            <p className={styles.placeholderText}>
              Зображення для транскрибування
            </p>
            <p className={styles.placeholderSubtext}>(Панель перегляду)</p>
          </div>
        )}
      </div>
    </div>
  );
}
