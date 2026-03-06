'use client';

import {
  ClipboardCheck,
  FileText,
  Sparkles,
  Upload,
  UserRound,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import AuthorForm from './author-form';
import ContextForm from './context-form';
import CsvDropzone from './csv-dropzone';
import DataGrid from './data-grid';
import ReviewSummary from './review-summary';
import SuccessPanel from './success-panel';

import styles from './stepper.module.css';

/* ────────────────────────────────────────── */
/*  Types                                      */
/* ────────────────────────────────────────── */

type StepStatus = 'completed' | 'active' | 'pending';

interface StepDefinition {
  label: string;
  icon: React.ReactNode;
  summary: string;
  placeholderTitle: string;
  placeholderBody: string;
  renderContent?: () => React.ReactNode;
}

/* ────────────────────────────────────────── */
/*  Step data                                  */
/* ────────────────────────────────────────── */

const STEPS: StepDefinition[] = [
  {
    label: 'Обрати файл таблиці',
    icon: <Upload size={15} strokeWidth={2.5} />,
    summary: 'dataset_q1_2026.csv uploaded — 12,483 rows, 24 columns',
    placeholderTitle: 'Upload your dataset',
    placeholderBody:
      // 'Drag & drop your CSV, JSON, or Parquet file here, or click to browse. We support files up to 500 MB.',
      'Перетягніть сюди файл CSV, або клацніть тут, аби обрати його. Підтримуються файли до 50 МіБ.',
    renderContent: () => <CsvDropzone />,
  },
  {
    label: 'Перевірити чистоту даних',
    icon: <Sparkles size={15} strokeWidth={2.5} />,
    summary: '142 nulls filled, 3 duplicate rows removed, types inferred',
    placeholderTitle: 'Review data quality',
    placeholderBody:
      'We detected potential issues in your dataset. Review suggested fixes for missing values, duplicate entries, and column type mismatches before proceeding.',
    renderContent: () => <DataGrid />,
  },
  {
    label: 'Додати контекст',
    icon: <FileText size={15} strokeWidth={2.5} />,
    summary: 'Description and 4 tags added to the dataset',
    placeholderTitle: 'Add context to your data',
    placeholderBody:
      'Provide a short description, relevant tags, and any additional notes that will help collaborators understand the purpose and scope of this dataset.',
    renderContent: () => <ContextForm />,
  },
  {
    label: 'Вказати авторство',
    icon: <UserRound size={15} strokeWidth={2.5} />,
    summary: 'Author set to Jane Doe (jane@acme.com)',
    placeholderTitle: 'Author information',
    placeholderBody:
      'Confirm the author details for this submission. This information will be displayed publicly alongside the dataset and used for attribution.',
    renderContent: () => <AuthorForm />,
  },
  {
    label: 'Перевірити введені дані',
    icon: <ClipboardCheck size={15} strokeWidth={2.5} />,
    summary: 'Submission reviewed and published successfully',
    placeholderTitle: 'Review & submit',
    placeholderBody:
      "Take a final look at your dataset, metadata, and author details. Once you're satisfied everything looks correct, hit submit to publish.",
    renderContent: () => <ReviewSummary />,
  },
];

/* ────────────────────────────────────────── */
/*  Checkmark SVG                              */
/* ────────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg
      className={styles.checkIcon}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ────────────────────────────────────────── */
/*  Single step                                */
/* ────────────────────────────────────────── */

function StepItem({
  def,
  index,
  status,
  isLast,
  onContinue,
  onBack,
  nextConnectorStatus,
}: {
  def: StepDefinition;
  index: number;
  status: StepStatus;
  isLast: boolean;
  onContinue: () => void;
  onBack: () => void;
  nextConnectorStatus: 'completed' | 'active' | 'pending' | 'hidden';
}) {
  /* indicator class */
  const indicatorClass =
    status === 'completed'
      ? styles.indicatorCompleted
      : status === 'active'
        ? styles.indicatorActive
        : styles.indicatorPending;

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

  return (
    <div className={styles.step}>
      {/* Left rail */}
      <div className={styles.rail}>
        <div className={indicatorClass} aria-hidden="true">
          {status === 'completed' ? <CheckIcon /> : index + 1}
        </div>
        <div className={connectorClass} />
      </div>

      {/* Body */}
      <div className={isLast ? styles.bodyLast : styles.body}>
        <div className={styles.header}>
          <span className={titleClass}>{def.label}</span>
        </div>

        {/* Completed → summary */}
        {status === 'completed' && (
          <p className={styles.summary}>{def.summary}</p>
        )}

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
                type="button"
                className={styles.btnPrimary}
                onClick={onContinue}
              >
                {isLast ? 'Подати' : 'Далі'}
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

/* ────────────────────────────────────────── */
/*  Main stepper                               */
/* ────────────────────────────────────────── */

export default function Stepper() {
  const [activeIndex, setActiveIndex] = useState(4);
  // Start with step 4 (Review) active so the summary is visible

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
          <StepItem
            key={step.label}
            def={step}
            index={index}
            status={status}
            isLast={index === STEPS.length - 1 && !allDone}
            onContinue={handleContinue}
            onBack={handleBack}
            nextConnectorStatus={nextConnectorStatus}
          />
        );
      })}

      {allDone && (
        <SuccessPanel
          name="Jane Doe"
          title="Tymofiivka Parish Records 1834-1912"
          prUrl="https://github.com/uadata/registry/pull/1847"
        />
      )}
    </div>
  );
}
