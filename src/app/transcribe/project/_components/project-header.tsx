import Link from 'next/link';
import { useMemo } from 'react';

import { ProjectHeaderProperties } from '../types';

import styles from '../page.module.css';

export default function ProjectHeader({
  projectData,
  projectId,
  existingImagesCount,
}: ProjectHeaderProperties) {
  const yearsDisplay = useMemo(() => {
    if (!projectData?.yearsRange) return null;
    const [start, end] = projectData.yearsRange;
    if (start === end || projectData.yearsRange.length === 1) return start;
    return `${start} - ${end}`;
  }, [projectData?.yearsRange]);

  return (
    <div className={styles.header}>
      <div className={styles.projectInfo}>
        <h1 className={styles.title}>
          {projectData?.title || 'Project Details'}
        </h1>
        <div className={styles.metaSummary}>
          <span className={styles.badge}>{projectData?.type}</span>
          {projectData?.tableLocale && (
            <span>Locale: {projectData.tableLocale}</span>
          )}
          {yearsDisplay && <span>Years: {yearsDisplay}</span>}
        </div>
      </div>
      <div className={styles.ctaContainer}>
        {existingImagesCount === 0 ? (
          <button
            disabled
            className={styles.ctaButton}
            data-testid="enter-workspace-btn"
          >
            Enter Workspace
          </button>
        ) : (
          <Link
            href={`/transcribe/workspace/?projectId=${projectId}`}
            className={styles.ctaButton}
            data-testid="enter-workspace-btn"
          >
            Enter Workspace
          </Link>
        )}
      </div>
    </div>
  );
}
