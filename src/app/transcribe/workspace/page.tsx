'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import type { ProjectImage } from '../schemata';

import ImageViewer from './_components/image-viewer';
import PageNameForm from './_components/page-name-form';
import TranscriptionTable from './_components/transcription-table';
import { useImageTransform } from './_hooks/use-image-transform';
import { useProjectImages } from './_hooks/use-project-images';
import {
  type ColumnConfig,
  useTranscriptionRows,
} from './_hooks/use-transcription-rows';

import styles from './page.module.css';

const POC_COLUMNS: ColumnConfig[] = [
  {
    id: 'HH',
    title: '#HH',
    hint: 'Number of household',
    expectedType: 'number',
  },
  { id: 'M', title: '#M', hint: 'Number of male', expectedType: 'number' },
  { id: 'F', title: '#F', hint: 'Number of female', expectedType: 'number' },
  {
    id: 'Name',
    title: 'Name',
    hint: '',
    expectedType: 'string',
    isExtended: true,
  },
  { id: 'aM', title: 'aM', hint: 'Age of male', expectedType: 'string' },
  { id: 'aF', title: 'aF', hint: 'Age of female', expectedType: 'string' },
  {
    id: 'Note',
    title: 'Note',
    hint: 'Anything to the right of the age',
    expectedType: 'string',
    isExtended: true,
  },
];

function TranscribeProjectPageContent() {
  const {
    projectId,
    images,
    setImages,
    projectLocale,
    currentImageIndex,
    setCurrentImageIndex,
    isLoading,
    error,
  } = useProjectImages();

  const {
    transform,
    isDragging,
    viewerReference,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleZoomIn,
    handleZoomOut,
    handleResetTransform,
  } = useImageTransform(isLoading);

  const { rows, addRow, deleteRow, updateRow } =
    useTranscriptionRows(POC_COLUMNS);

  const handleNextImage = () => {
    setCurrentImageIndex((previous) =>
      Math.min(previous + 1, images.length - 1),
    );
    handleResetTransform();
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((previous) => Math.max(previous - 1, 0));
    handleResetTransform();
  };

  const handleImageUpdated = (updatedImage: ProjectImage) => {
    setImages((previous) =>
      previous.map((image) =>
        image.id === updatedImage.id
          ? { ...image, pageName: updatedImage.pageName }
          : image,
      ),
    );
  };

  if (!projectId || isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>Завантаження зображень проекту...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];
  const hasPageName =
    images.length > 0 && Boolean(images[currentImageIndex].pageName);

  return (
    <div className={styles.workspace}>
      <div className={styles.leftPanel}>
        <ImageViewer
          images={images}
          currentImageIndex={currentImageIndex}
          onPreviousImage={handlePreviousImage}
          onNextImage={handleNextImage}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetTransform={handleResetTransform}
          transform={transform}
          isDragging={isDragging}
          viewerReference={viewerReference}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>

      <div className={styles.rightPanel}>
        <Link
          href={`/transcribe/project/?projectId=${projectId}`}
          className={styles.backLink}
        >
          <ArrowLeft size={16} />
          Назад до проекту
        </Link>

        <PageNameForm
          projectId={projectId}
          image={currentImage}
          onImageUpdated={handleImageUpdated}
          images={images}
        />

        <TranscriptionTable
          columns={POC_COLUMNS}
          rows={rows}
          hasPageName={hasPageName}
          projectLocale={projectLocale}
          onAddRow={addRow}
          onDeleteRow={deleteRow}
          onUpdateRow={updateRow}
        />
      </div>
    </div>
  );
}

export default function TranscribeProjectPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingContainer}>
          <div className={styles.loading}>Завантаження сторінки...</div>
        </div>
      }
    >
      <TranscribeProjectPageContent />
    </Suspense>
  );
}
