'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useContributionStateStore } from './contribution-state';
import ContributeFormStep from './step';
import STEPS from './steps';
import SuccessPanel from './success-panel';
import { useTableStateStore } from './table-state';
import type { ContributeForm2Values, StepStatus } from './types';

import styles from './stepper.module.css';

/* ────────────────────────────────────────── */
/*  Main ContributeFormStepper                               */
/* ────────────────────────────────────────── */
export default function ContributeFormStepper() {
  const [activeIndex, setActiveIndex] = useState(4);
  const { tableFileName } = useTableStateStore();
  const {
    formState: { errors },
    control,
  } = useFormContext<ContributeForm2Values>();
  // Start with step 4 (Review) active so the summary is visible
  useEffect(() => {
    if (!tableFileName) setActiveIndex(0);
  }, [tableFileName]);

  // Listen for navigation events from the ReviewSummary component
  useEffect(() => {
    const handleGoToStep = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      setActiveIndex(customEvent.detail);
    };
    globalThis.addEventListener('contribute:go-to-step', handleGoToStep);
    return () =>
      globalThis.removeEventListener('contribute:go-to-step', handleGoToStep);
  }, []);

  const statusOf = useCallback(
    (index: number): StepStatus => {
      if (index < activeIndex) return 'completed';
      if (index === activeIndex) return 'active';
      return 'pending';
    },
    [activeIndex],
  );

  const handleContinue = useCallback(() => {
    setActiveIndex((previous) => Math.min(previous + 1, STEPS.length));
  }, []);

  const handleBack = useCallback(() => {
    setActiveIndex((previous) => Math.max(previous - 1, 0));
  }, []);

  /* After the last step is "continued", all are completed */
  const allDone = activeIndex >= STEPS.length;
  const nameValue = useWatch({ control, name: 'authorName' });
  const {
    state: { error, isSubmitting, prUrl, title },
  } = useContributionStateStore();

  useEffect(() => {
    for (const [index, step] of STEPS.entries()) {
      if (index > activeIndex) {
        return;
      }
      for (const field of step.fields) {
        if (errors[field]) {
          setActiveIndex(index);
          return;
        }
      }
    }
  }, [activeIndex, errors]);

  return (
    <div
      className={styles.wrapper}
      role="list"
      aria-label="Кроки оформлення таблиці"
    >
      {STEPS.map((step, index) => {
        const status: StepStatus = allDone ? 'completed' : statusOf(index);

        let nextConnectorStatus: 'completed' | 'active' | 'pending' | 'hidden';
        if (index === STEPS.length - 1) {
          nextConnectorStatus = allDone ? 'completed' : 'hidden';
        } else if (allDone || index + 1 < activeIndex) {
          nextConnectorStatus = 'completed';
        } else if (index + 1 === activeIndex) {
          nextConnectorStatus = 'active';
        } else {
          nextConnectorStatus = 'pending';
        }

        return (
          <ContributeFormStep
            key={step.label}
            def={step}
            index={index}
            status={status}
            isLast={index === STEPS.length - 1 && !allDone}
            onActivate={() => setActiveIndex(index)}
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
