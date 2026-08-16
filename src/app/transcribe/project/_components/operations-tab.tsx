'use client';

import { useCsvExport } from '../_hooks/use-csv-export';
import type { OperationsTabProperties } from '../types';

import styles from '../page.module.css';

export default function OperationsTab({
  projectId,
  projectType,
}: OperationsTabProperties) {
  const { exportCsv, isExporting } = useCsvExport(projectId, projectType);

  return (
    <div className={styles.operationsContainer}>
      <h2>Операції з даними</h2>
      <div className={styles.operationsActions}>
        <button
          onClick={() => {
            void exportCsv();
          }}
          disabled={isExporting}
          className={styles.ctaButton}
        >
          {isExporting ? 'Експортується…' : 'Експортувати CSV'}
        </button>
      </div>
    </div>
  );
}
