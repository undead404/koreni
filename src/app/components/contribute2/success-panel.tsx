'use client';

import { CheckCircle2, Clock, ExternalLink, Globe } from 'lucide-react';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { useContributionStateStore } from './contribution-state';
import getDefaultValues from './default-values';
import { useTableStateStore } from './table-state';
import type { ContributeForm2Values } from './types';

import styles from './success-panel.module.css';

interface SuccessPanelProperties {
  name: string;
  prUrl: string;
  title: string;
}

function useResetContribution() {
  const { reset } = useFormContext<ContributeForm2Values>();
  const { resetState } = useContributionStateStore();
  const { reset: resetTableState } = useTableStateStore();

  return useCallback(() => {
    reset(getDefaultValues());
    resetState();
    resetTableState();
  }, [reset, resetState, resetTableState]);
}

export default function SuccessPanel({
  name,
  prUrl,
  title,
}: SuccessPanelProperties) {
  const handleReset = useResetContribution();
  const { getTableDimensions } = useTableStateStore();
  const { rows } = getTableDimensions();

  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      {/* Animated checkmark */}
      <div className={styles.iconRing}>
        <span className="sr-only">Success</span>
        <svg
          className={styles.checkSvg}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12l5 5L19 7" />
        </svg>
      </div>

      {/* Thank-you message */}
      <p className={styles.heading}>
        {'Дякуємо, '}
        {name}
        {'! Ваша таблиця '}
        <span className={styles.title}>{`\u201C${title}\u201D`}</span>
        {' була успішно надіслана.'}
      </p>

      {/* Process Visualization Stepper */}
      <div className={styles.stepper}>
        <div className={styles.step} data-active="true">
          <CheckCircle2 size={20} className={styles.stepIcon} />
          <span>Надіслано</span>
        </div>
        <div className={styles.stepLine} />
        <div className={styles.step} data-active="false">
          <Clock size={20} className={styles.stepIcon} />
          <span>Перевірка</span>
        </div>
        <div className={styles.stepLine} />
        <div className={styles.step} data-active="false">
          <Globe size={20} className={styles.stepIcon} />
          <span>Опубліковано</span>
        </div>
      </div>

      {/* Submission Summary */}
      <details className={styles.summaryDetails}>
        <summary className={styles.summaryTitle}>Переглянути підсумки</summary>
        <div className={styles.summaryContent}>
          <p>
            <strong>Назва:</strong> {title}
          </p>
          <p>
            <strong>Кількість рядків:</strong> {rows}
          </p>
        </div>
      </details>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={handleReset}
        >
          Додати ще одну таблицю
        </button>

        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.secondaryAction}
        >
          <span className={styles.prLinkIcon}>
            <ExternalLink size={16} />
          </span>
          Переглянути PR на GitHub
        </a>
      </div>
    </div>
  );
}
