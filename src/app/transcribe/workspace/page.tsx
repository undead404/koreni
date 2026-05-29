'use client';

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Maximize2,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import z from 'zod';

import { nonEmptyString } from '@/shared/schemas/non-empty-string';

import getProjectImages from '../api/get-project-images';
import type { ProjectImage } from '../schemata';

import styles from './page.module.css';

const projectSearchParametersSchema = z.object({
  projectId: nonEmptyString.regex(/^[a-z0-9-]+$/i),
});

interface TranscriptionRow {
  id: string;
  lastName: string;
  firstName: string;
  yearOrAge: string;
  notes: string;
}

function TranscribeProjectPageContent() {
  const router = useRouter();
  const searchParameters = useSearchParams();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Image transform state
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const viewerReference = useRef<HTMLDivElement>(null);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  // Wheel zoom handling
  useEffect(() => {
    const viewer = viewerReference.current;
    if (!viewer) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      setTransform((previous) => ({
        ...previous,
        scale: Math.min(Math.max(previous.scale * delta, 0.1), 5),
      }));
    };

    viewer.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      viewer.removeEventListener('wheel', handleWheel);
    };
  }, [isLoading, projectId]);

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    lastMousePosition.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = event.clientX - lastMousePosition.current.x;
    const deltaY = event.clientY - lastMousePosition.current.y;

    lastMousePosition.current = { x: event.clientX, y: event.clientY };

    setTransform((previous) => ({
      ...previous,
      x: previous.x + deltaX,
      y: previous.y + deltaY,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = useCallback(() => {
    setTransform((previous) => ({
      ...previous,
      scale: Math.min(previous.scale * 1.2, 5),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform((previous) => ({
      ...previous,
      scale: Math.max(previous.scale / 1.2, 0.1),
    }));
  }, []);

  const handleResetTransform = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
  }, []);

  // Persistence for currentImageIndex
  useEffect(() => {
    if (!projectId || images.length === 0) return;

    const storageKey = `koreni_workspace_${projectId}_image_index`;
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      const index = Number.parseInt(stored, 10);
      if (!Number.isNaN(index) && index >= 0 && index < images.length) {
        setCurrentImageIndex(index);
      }
    }
  }, [projectId, images.length]);

  useEffect(() => {
    if (!projectId) return;

    const storageKey = `koreni_workspace_${projectId}_image_index`;
    localStorage.setItem(storageKey, currentImageIndex.toString());
  }, [projectId, currentImageIndex]);

  // Transcription state
  const [rows, setRows] = useState<TranscriptionRow[]>([
    {
      id: crypto.randomUUID(),
      lastName: '',
      firstName: '',
      yearOrAge: '',
      notes: '',
    },
  ]);

  // Validate projectId search param
  useEffect(() => {
    try {
      const rawProjectId = searchParameters.get('projectId');
      const parsed = projectSearchParametersSchema.parse({
        projectId: rawProjectId,
      });
      setProjectId(parsed.projectId);
    } catch {
      // Removed console.error for missing projectId search param
      router.push('/transcribe');
    }
  }, [router, searchParameters]);

  // Fetch images once projectId is valid
  useEffect(() => {
    if (!projectId) return;

    const activeProjectId = projectId;
    setIsLoading(true);
    setError(null);

    const abortController = new AbortController();

    async function fetchImages() {
      try {
        const data = await getProjectImages(
          activeProjectId,
          abortController.signal,
        );
        if (abortController.signal.aborted) return;

        setImages(data);
        setIsLoading(false);

        if (data.length === 0) {
          router.push(`/transcribe/project/?projectId=${activeProjectId}`);
        }
      } catch {
        if (abortController.signal.aborted) return;

        // Removed console.error for failed image fetch
        const message = 'Failed to load project images';
        setError(message);
        setIsLoading(false);
        toast.error(message);
      }
    }

    void fetchImages();

    return () => {
      abortController.abort();
    };
  }, [projectId, router]);

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        lastName: '',
        firstName: '',
        yearOrAge: '',
        notes: '',
      },
    ]);
  };

  const deleteRow = (id: string) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const updateRow = (
    id: string,
    field: keyof TranscriptionRow,
    value: string,
  ) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const nextImage = () => {
    setCurrentImageIndex((previous) =>
      Math.min(previous + 1, images.length - 1),
    );
    handleResetTransform();
  };

  const previousImage = () => {
    setCurrentImageIndex((previous) => Math.max(previous - 1, 0));
    handleResetTransform();
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

  return (
    <div className={styles.workspace}>
      {/* Left Panel: Image Viewer Placeholder */}
      <div className={styles.leftPanel}>
        <div className={styles.viewerContainer}>
          <div className={styles.viewerHeader}>
            <div className={styles.navigationControls}>
              <button
                className={styles.iconButton}
                onClick={previousImage}
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
                onClick={nextImage}
                disabled={currentImageIndex === images.length - 1}
                title="Next Image"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className={styles.viewerControls}>
              <button
                className={styles.iconButton}
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <button
                className={styles.iconButton}
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <button
                className={styles.iconButton}
                onClick={handleResetTransform}
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
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
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
      </div>

      {/* Right Panel: Tabular Data Input Grid */}
      <div className={styles.rightPanel}>
        <Link
          href={`/transcribe/project/?projectId=${projectId}`}
          className={styles.backLink}
        >
          <ArrowLeft size={16} />
          Назад до проекту
        </Link>
        <div className={styles.tableHeader}>
          <h2>Транскрипція</h2>
          <button className={styles.addButton} onClick={addRow}>
            <Plus size={16} />
            Додати рядок
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>No.</th>
                <th>Прізвище</th>
                <th>Ім&apos;я</th>
                <th>Рік народження / Вік</th>
                <th>Примітки</th>
                <th style={{ width: '60px' }}>Дії</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td className={styles.indexCell}>{index + 1}</td>
                  <td>
                    <input
                      type="text"
                      className={styles.input}
                      value={row.lastName}
                      onChange={(event_) => {
                        updateRow(row.id, 'lastName', event_.target.value);
                      }}
                      placeholder="Прізвище"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.input}
                      value={row.firstName}
                      onChange={(event_) => {
                        updateRow(row.id, 'firstName', event_.target.value);
                      }}
                      placeholder="Ім'я"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.input}
                      value={row.yearOrAge}
                      onChange={(event_) => {
                        updateRow(row.id, 'yearOrAge', event_.target.value);
                      }}
                      placeholder="Вік"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.input}
                      value={row.notes}
                      onChange={(event_) => {
                        updateRow(row.id, 'notes', event_.target.value);
                      }}
                      placeholder="Примітки"
                    />
                  </td>
                  <td className={styles.actionCell}>
                    <button
                      className={styles.deleteButton}
                      onClick={() => {
                        deleteRow(row.id);
                      }}
                      title="Видалити"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className={styles.emptyState}>
              Натисніть &quot;Додати рядок&quot;, щоб почати транскрибування.
            </div>
          )}
        </div>
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
