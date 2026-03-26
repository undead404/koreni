'use client';

import { ExternalLink } from 'lucide-react';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { useContributionStateStore } from './contribution-state';
import getDefaultValues from './default-values';
import { useTableStateStore } from './table-state';
import { ContributeForm2Values } from './types';

import styles from './success-panel.module.css';

interface SuccessPanelProperties {
  name: string;
  prUrl: string;
  title: string;
}

export default function SuccessPanel({
  name,
  prUrl,
  title,
}: SuccessPanelProperties) {
  const { reset } = useFormContext<ContributeForm2Values>();
  const { setState } = useContributionStateStore();
  const { reset: resetTableState } = useTableStateStore();
  const handleReset = useCallback(() => {
    reset(getDefaultValues());
    setState({
      activeIndex: 0,
      stage: 'idle',
      error: '',
      isSubmitting: false,
      prUrl: '',
      title: '',
    });
    resetTableState();
  }, [reset, resetTableState, setState]);
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      {/* Animated checkmark */}
      <div className={styles.iconRing} aria-hidden="true">
        <svg
          className={styles.checkSvg}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
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
        {' була збережена у вигляді PR на GitHub:'}
      </p>

      <p className={styles.sub}>
        {
          'Невдовзі команда Коренів її перевірить. Якщо все добре, вона буде опублікована на сайті.'
        }
      </p>

      {/* PR link chip */}
      <a
        href={prUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.prLink}
      >
        <span className={styles.prLinkIcon}>
          <ExternalLink size={14} />
        </span>
        {prUrl.replace('https://', '')}
      </a>
      <button
        type="button"
        className={styles.addAnotherBtn}
        onClick={handleReset}
      >
        Додати ще одну таблицю
      </button>
    </div>
  );
}
