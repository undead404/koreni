'use client';

import {
  Image as ImageIcon,
  Maximize2,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            <span className={styles.imageInfo}>
              {images[0]?.storageKey || 'Зображення'}
            </span>
            <div className={styles.viewerControls}>
              <button className={styles.iconButton} title="Zoom In">
                <ZoomIn size={18} />
              </button>
              <button className={styles.iconButton} title="Zoom Out">
                <ZoomOut size={18} />
              </button>
              <button className={styles.iconButton} title="Reset">
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
          <div className={styles.imagePlaceholder}>
            <ImageIcon size={64} className={styles.placeholderIcon} />
            <p className={styles.placeholderText}>
              Зображення для транскрибування
            </p>
            <p className={styles.placeholderSubtext}>(Панель перегляду)</p>
          </div>
        </div>
      </div>

      {/* Right Panel: Tabular Data Input Grid */}
      <div className={styles.rightPanel}>
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
