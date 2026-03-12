'use client';
import { useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import CheckIcon from '@/app/icons/check';

import { useContributionStateStore } from './contribution-state';
import { useTableStateStore } from './table-state';
import type {
  ContributeForm2Values,
  StepDefinition,
  StepStatus,
} from './types';

import styles from './step.module.css';
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
  const { control, trigger } = useFormContext<ContributeForm2Values>();
  /* indicator class */
  const indicatorClass =
    status === 'completed'
      ? styles.indicatorCompleted
      : status === 'active'
        ? styles.indicatorActive
        : styles.indicatorPending;
  const allValues = useWatch({ control });

  /* connector class */
  const connectorClass =
    nextConnectorStatus === 'completed'
      ? styles.connectorCompleted
      : nextConnectorStatus === 'active'
        ? styles.connectorActive
        : nextConnectorStatus === 'hidden'
          ? styles.connectorHidden
          : styles.connectorPending;

  /* title class */
  const titleClass =
    status === 'completed'
      ? styles.titleCompleted
      : status === 'active'
        ? styles.titleActive
        : styles.titlePending;
  const summary =
    typeof def.summary === 'function'
      ? def.summary(tableStore, allValues as ContributeForm2Values)
      : def.summary;

  const handleContinue = useCallback(() => {
    if (def.fields.length === 0) {
      onContinue();
      return;
    }
    void trigger(def.fields).then((result) => {
      if (result) {
        onContinue();
      }
      return;
    });
  }, [def.fields, onContinue, trigger]);
  const {
    state: { isSubmitting },
  } = useContributionStateStore();

  return (
    <div className={styles.step}>
      {/* Left rail */}
      <div className={styles.rail}>
        {status === 'completed' ? (
          <button
            className={indicatorClass}
            onClick={onActivate}
            aria-hidden="true"
            type="button"
          >
            <CheckIcon className={styles.checkIcon} />
          </button>
        ) : (
          <div className={indicatorClass} aria-hidden="true">
            {index + 1}
          </div>
        )}
        <div className={connectorClass} />
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
        {status === 'completed' && <p className={styles.summary}>{summary}</p>}

        {/* Active → expanded content */}
        {status === 'active' && (
          <div className={styles.content}>
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

            <div className={styles.actions}>
              {index > 0 && (
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={onBack}
                >
                  Назад
                </button>
              )}
              <button
                disabled={isSubmitting}
                type={isLast ? 'submit' : 'button'}
                className={styles.btnPrimary}
                onClick={isLast ? undefined : handleContinue}
              >
                {isSubmitting ? 'Подається...' : null}
                {isLast && !isSubmitting ? 'Подати' : 'Далі'}
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
          </div>
        )}
      </div>
    </div>
  );
}
