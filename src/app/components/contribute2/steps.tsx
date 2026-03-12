import {
  ClipboardCheck,
  FileText,
  Sparkles,
  Upload,
  UserRound,
} from 'lucide-react';

import AuthorForm from './author-form';
import ContextForm from './context-form';
import CsvDropzone from './csv-dropzone';
import DataGrid from './data-grid';
import ReviewSummary from './review-summary';
import { TableStateStore } from './table-state';
import type { StepDefinition } from './types';

/* ────────────────────────────────────────── */
const STEPS: StepDefinition[] = [
  {
    fields: ['table'],
    label: 'Обрати файл таблиці',
    icon: <Upload size={15} strokeWidth={2.5} />,
    placeholderTitle: 'Оберіть таблицю',
    placeholderBody:
      'Перетягніть сюди файл CSV, або клацніть тут, аби обрати його. Підтримуються файли до 50 МіБ.',
    renderContent: () => <CsvDropzone />,
    summary: (tableState: TableStateStore) =>
      `Таблиця ${tableState.tableFileName} — ${tableState.getTableDimensions().rows.toLocaleString()} рядів, ${tableState.getTableDimensions().columns.toLocaleString()} колонки`,
  },
  {
    fields: ['table', 'tableLocale'],
    label: 'Перевірити чистоту даних',
    icon: <Sparkles size={15} strokeWidth={2.5} />,
    summary: (tableState: TableStateStore) =>
      `Вилучено ${tableState.skippedColumns.size} колонки, ${tableState.skippedRowsAbove + tableState.skippedRowsElsewhere.size} рядів`,
    placeholderTitle: 'Перевірте чистоту даних',
    placeholderBody:
      //   'We detected potential issues in your dataset. Review suggested fixes for missing values, duplicate entries, and column type mismatches before proceeding.',
      'В таблиці виявлено можливі проблеми. Перевірте пропозиції щодо порожніх рядів і зайвих колонок',
    renderContent: () => <DataGrid />,
  },
  {
    fields: [
      'archiveItems',
      'id',
      'location',
      'sources',
      'title',
      'yearsRange',
    ],
    label: 'Додати контекст',
    icon: <FileText size={15} strokeWidth={2.5} />,
    summary: (tableStore, formData) =>
      `${formData.title} (${formData?.yearsRange?.join('-')})`,
    placeholderTitle: 'Додайте контекст цієї таблиці',
    placeholderBody:
      'Provide a short description, relevant tags, and any additional notes that will help collaborators understand the purpose and scope of this dataset.',
    renderContent: () => <ContextForm />,
  },
  {
    fields: ['authorName', 'authorEmail', 'authorGithubUsername'],
    label: 'Вказати авторство',
    icon: <UserRound size={15} strokeWidth={2.5} />,
    summary: (tableStore, formData) =>
      `Автор – ${formData.authorName}${formData.authorEmail ? ` (${formData.authorEmail})` : ''}${formData.authorGithubUsername ? ` (https://github.com/${formData.authorGithubUsername})` : ''}`,
    placeholderTitle: 'Інформація про автора таблиці',
    placeholderBody:
      'Підтвердіть інформацію про автора цієї таблиці. Вона буде відображатися поруч з таблицею.',
    renderContent: () => <AuthorForm />,
  },
  {
    fields: [],
    label: 'Перевірити введені дані',
    icon: <ClipboardCheck size={15} strokeWidth={2.5} />,
    summary: 'Таблиця пройшла первинну перевірку',
    placeholderTitle: 'Перевірити й подати',
    placeholderBody:
      'Перевірте загальну інформацію про таблицю, її метадані та відомості про автора. Якщо все має коректний вигляд, клацніть кнопку "Подати".',
    renderContent: () => <ReviewSummary />,
  },
];
export default STEPS;
