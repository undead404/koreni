'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import getProjectImages from '../../api/get-project-images';
import { getColumnsBySchemaValue } from '../../api/get-project-schemas';
import { buildRowArraySchema } from '../../workspace/_helpers/build-row-array-schema';
import type { ColumnConfig } from '../../workspace/_helpers/column-config';

function escapeCsvField(value: string): string {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function serializeToCsv(header: string[], rows: string[][]): string {
  const lines = [header, ...rows].map((row) =>
    row.map((value) => escapeCsvField(value)).join(','),
  );
  return '\uFEFF' + lines.join('\r\n');
}

function triggerDownload(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useCsvExport(
  projectId: string,
  projectType: string,
): { exportCsv: () => Promise<void>; isExporting: boolean } {
  const [isExporting, setIsExporting] = useState(false);

  const exportCsv = async (): Promise<void> => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      let columns: ColumnConfig[];
      try {
        columns = getColumnsBySchemaValue(projectType);
      } catch {
        toast.error('Невідомий тип схеми проекту');
        return;
      }

      let images;
      try {
        images = await getProjectImages(projectId, { withTranscription: true });
      } catch {
        toast.error('Не вдалося завантажити зображення проекту');
        return;
      }

      const rowArraySchema = buildRowArraySchema(columns);
      const allRows: string[][] = [];
      let hasCorruption = false;

      for (const image of images) {
        if (!image.transcription) continue;

        let parsed: unknown;
        try {
          parsed = JSON.parse(image.transcription);
        } catch {
          hasCorruption = true;
          continue;
        }

        const result = rowArraySchema.safeParse(parsed);
        if (!result.success) {
          hasCorruption = true;
          continue;
        }

        for (const row of result.data) {
          const rowRecord = row as unknown as Record<string, string>;
          allRows.push(columns.map((col) => rowRecord[col.id] ?? ''));
        }
      }

      if (hasCorruption) {
        toast.error(
          'Дані проекту пошкоджені: деякі зображення містять некоректні записи',
        );
      }

      const header = columns.map((col) => col.title);
      const csvContent = serializeToCsv(header, allRows);
      triggerDownload(csvContent, `${projectId}.csv`);
    } catch {
      toast.error('Не вдалося експортувати CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return { exportCsv, isExporting };
}
