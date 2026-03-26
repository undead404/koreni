'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useContributionStateStore } from './contribution-state';
import ContributeFormStep from './step';
import STEPS from './steps';
import SuccessPanel from './success-panel';
import { useTableStateStore } from './table-state';
import type { ContributeForm2Values, StepStatus } from './types';

import styles from './stepper.module.css';

/* ────────────────────────────────────────── */
/*  Helpers                                    */
/* ────────────────────────────────────────── */
const getConnectorStatus = (
  index: number,
  active: number,
  isAllDone: boolean,
  total: number,
): 'completed' | 'active' | 'pending' | 'hidden' => {
  if (index === total - 1) return isAllDone ? 'completed' : 'hidden';
  if (isAllDone || index < active) return 'completed';
  if (index === active) return 'active';
  return 'pending';
};

/* ────────────────────────────────────────── */
/*  Main ContributeFormStepper                 */
/* ────────────────────────────────────────── */
export default function ContributeFormStepper() {
  const { tableFileName } = useTableStateStore();
  const {
    formState: { errors },
    control,
  } = useFormContext<ContributeForm2Values>();

  const { state, setActiveIndex } = useContributionStateStore();
  const { activeIndex, error, isSubmitting, prUrl, title } = state;

  console.log('activeIndex', activeIndex);

  // Reset to step 0 if no table file is selected
  useEffect(() => {
    if (!tableFileName) {
      console.log('No tableFileName');
      setActiveIndex(0);
    }
  }, [tableFileName, setActiveIndex]);

  const statusOf = useCallback(
    (index: number): StepStatus => {
      if (index < activeIndex) return 'completed';
      if (index === activeIndex) return 'active';
      return 'pending';
    },
    [activeIndex],
  );

  const handleContinue = useCallback(() => {
    console.log('handleContinue');
    setActiveIndex((previous) => Math.min(previous + 1, STEPS.length));
  }, [setActiveIndex]);

  const handleBack = useCallback(() => {
    console.log('handleBack');
    setActiveIndex((previous) => Math.max(previous - 1, 0));
  }, [setActiveIndex]);

  /* allDone is strictly defined by submission success */
  const allDone = useMemo(() => !!prUrl, [prUrl]);
  const nameValue = useWatch({ control, name: 'authorName' });

  // Stable validation effect: only move backward if a previous step becomes invalid
  useEffect(() => {
    let firstErrorIndex = -1;
    for (const [index, step] of STEPS.entries()) {
      if (step.fields.some((field) => errors[field])) {
        firstErrorIndex = index;
        break;
      }
    }

    if (firstErrorIndex !== -1 && firstErrorIndex < activeIndex) {
      console.log('firstErrorIndex', firstErrorIndex);
      setActiveIndex(firstErrorIndex);
    }
  }, [errors, activeIndex, setActiveIndex]);

  return (
    <div
      className={styles.wrapper}
      role="list"
      aria-label="Кроки оформлення таблиці"
      aria-live="polite"
    >
      {STEPS.map((step, index) => {
        const status: StepStatus = allDone ? 'completed' : statusOf(index);
        const nextConnectorStatus = getConnectorStatus(
          index,
          activeIndex,
          allDone,
          STEPS.length,
        );

        return (
          <ContributeFormStep
            key={step.label}
            def={step}
            index={index}
            status={status}
            isLast={index === STEPS.length - 1 && !allDone}
            onActivate={() => {
              console.log('onActivate', index);
              setActiveIndex(index);
            }}
            onContinue={handleContinue}
            onBack={handleBack}
            nextConnectorStatus={nextConnectorStatus}
          />
        );
      })}

      {isSubmitting && (
        <div className={styles.loaderWrapper}>
          <div className={styles.loader} />
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p className={styles.errorTitle}>Помилка</p>
          <p className={styles.errorBody}>{error}</p>
        </div>
      )}

      {prUrl && <SuccessPanel name={nameValue} title={title} prUrl={prUrl} />}
    </div>
  );
}
