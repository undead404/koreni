'use client';
import { clsx } from 'clsx';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import CheckIcon from '@/app/icons/check';

import { useContributionStateStore } from './contribution-state';
import { useTableStateStore } from './table-state';
import type { ContributeFormValues, StepDefinition, StepStatus } from './types';

import styles from './step.module.css';

/* ────────────────────────────────────────── */
/*  Class Maps                                 */
/* ────────────────────────────────────────── */
const indicatorStatusMap: Record<StepStatus, string> = {
  completed: styles.indicatorCompleted,
  active: styles.indicatorActive,
  pending: styles.indicatorPending,
};

const connectorStatusMap: Record<
  'completed' | 'active' | 'pending' | 'hidden',
  string
> = {
  completed: styles.connectorCompleted,
  active: styles.connectorActive,
  pending: styles.connectorPending,
  hidden: styles.connectorHidden,
};

const titleStatusMap: Record<StepStatus, string> = {
  completed: styles.titleCompleted,
  active: styles.titleActive,
  pending: styles.titlePending,
};

/* ────────────────────────────────────────── */
/*  Single step                                */
/* ────────────────────────────────────────── */
export default function ContributeFormStep({
  def,
  index,
  status,
  isLast,
  onActivate,
  onContinue,
  onBack,
  nextConnectorStatus,
}: {
  def: StepDefinition;
  index: number;
  status: StepStatus;
  isLast: boolean;
  onActivate: () => void;
  onContinue: () => void;
  onBack: () => void;
  nextConnectorStatus: 'completed' | 'active' | 'pending' | 'hidden';
}) {
  const tableStore = useTableStateStore();
  const { control, trigger } = useFormContext<ContributeFormValues>();
  const allValues = useWatch({ control });

  const [isValidating, setIsValidating] = useState(false);
  const [hasError, setHasError] = useState(false);

  const {
    state: { isSubmitting },
  } = useContributionStateStore();

  /* Classes */
  const indicatorClass = clsx(
    indicatorStatusMap[status],
    isValidating && styles.indicatorValidating,
    hasError && styles.shake,
  );
  const connectorClass = connectorStatusMap[nextConnectorStatus];
  const titleClass = titleStatusMap[status];

  const summary =
    typeof def.summary === 'function'
      ? def.summary(tableStore, allValues as ContributeFormValues)
      : def.summary;
  const posthog = usePostHog();

  const handleContinue = useCallback(() => {
    if (def.fields.length === 0) {
      onContinue();
      return;
    }

    setIsValidating(true);
    setHasError(false);

    void trigger(def.fields).then((result) => {
      setIsValidating(false);
      posthog.capture('step_validation', {
        step: def.label,
        valid: result,
      });
      // eslint-disable-next-line promise/always-return
      if (result) {
        onContinue();
      } else {
        setHasError(true);
        // Remove shake class after animation completes so it can trigger again
        setTimeout(() => {
          setHasError(false);
        }, 400);
      }
    });
  }, [def.fields, def.label, onContinue, posthog, trigger]);

  const renderActions = () => (
    <div className={styles.actions}>
      {index > 0 && (
        <button type="button" className={styles.btnSecondary} onClick={onBack}>
          Назад
        </button>
      )}
      <button
        disabled={isSubmitting || isValidating}
        type={isLast ? 'submit' : 'button'}
        className={styles.btnPrimary}
        onClick={isLast ? undefined : handleContinue}
      >
        {isSubmitting ? 'Подається...' : null}
        {isLast && !isSubmitting ? 'Подати' : null}
        {!isLast && !isSubmitting ? 'Далі' : null}
        {!isLast && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <div
      className={styles.step}
      aria-current={status === 'active' ? 'step' : undefined}
    >
      {/* Left rail */}
      <div className={styles.rail}>
        {status === 'completed' ? (
          <button
            className={indicatorClass}
            onClick={onActivate}
            type="button"
            aria-label={`Крок ${index + 1}: Завершено. Натисніть, щоб повернутися.`}
          >
            <span className={styles.srOnly}>Крок {index + 1}: Завершено</span>
            <CheckIcon className={styles.checkIcon} aria-hidden="true" />
          </button>
        ) : (
          <div className={indicatorClass} aria-hidden="true">
            <span className={styles.srOnly}>
              Крок {index + 1}: {status === 'active' ? 'Поточний' : 'Очікує'}
            </span>
            {index + 1}
          </div>
        )}
        <div className={connectorClass} aria-hidden="true" />
      </div>

      {/* Body */}
      <div className={isLast ? styles.bodyLast : styles.body}>
        <div className={styles.header}>
          {status === 'completed' ? (
            <button className={titleClass} onClick={onActivate} type="button">
              {def.label}
            </button>
          ) : (
            <span className={titleClass}>{def.label}</span>
          )}
        </div>

        {/* Completed → summary */}
        {status === 'completed' && (
          <div className={styles.summary}>{summary}</div>
        )}

        {/* Active → expanded content */}
        {status === 'active' && (
          <div className={styles.content} aria-live="polite">
            {def.renderContent ? (
              def.renderContent()
            ) : (
              <>
                <p className={styles.contentPlaceholderTitle}>
                  {def.placeholderTitle}
                </p>
                <p className={styles.contentPlaceholder}>
                  {def.placeholderBody}
                </p>
              </>
            )}

            {renderActions()}
          </div>
        )}
      </div>
    </div>
  );
}
