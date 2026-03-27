'use client';

import { ErrorMessage } from '@hookform/error-message';
import { Info, Mail, User } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';

import type { ContributeForm2Values } from './types';

import styles from './author-form.module.css';

import githubIcon from '../../icons/github.svg';

interface FieldConfig {
  name: keyof ContributeForm2Values;
  label: string;
  type: string;
  placeholder: string;
  icon: ReactNode;
  autoComplete: string;
  required?: boolean;
  description?: string;
  isOptional?: boolean;
}

const FIELDS: FieldConfig[] = [
  {
    name: 'authorName',
    label: "Ім'я",
    type: 'text',
    placeholder: 'Іван Мельник',
    icon: <User size={14} strokeWidth={2} />,
    autoComplete: 'name',
    required: true,
    description:
      "Корені не публікують таблиці, чиє авторство невідоме. Якщо не хочете розкривати своє справжнє ім'я – вигадайте постійний псевдонім.",
  },
  {
    name: 'authorEmail',
    label: 'Електронна пошта',
    type: 'email',
    placeholder: 'ivanmelnyk@gmail.com',
    icon: <Mail size={14} strokeWidth={2} />,
    autoComplete: 'email',
    isOptional: true,
    description:
      "Необов'язково, але дуже бажано ввести. Потрібна, аби зацікавлені щодо даних таблиці особи могли з Вами зв'язатися.",
  },
  {
    name: 'authorGithubUsername',
    label: 'Обліковий запис GitHub',
    type: 'text',
    placeholder: 'janedoe',
    icon: <Image src={githubIcon} alt="GitHub" width={14} height={14} />,
    autoComplete: 'username',
    isOptional: true,
    description:
      "Необов'язково. Потрібен лише якщо бажаєте отримати сповіщення про розгляд і публікування Вашого внеску на Корені.",
  },
];

export default function AuthorForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ContributeForm2Values>();

  return (
    <fieldset className={styles.wrapper} aria-describedby="author-form-hint">
      {FIELDS.map((field) => {
        const errorId = `${field.name}-error`;
        const descriptionId = field.description
          ? `${field.name}-description`
          : undefined;
        const hasError = !!errors[field.name];

        const ariaDescribedBy =
          [hasError ? errorId : undefined, descriptionId]
            .filter(Boolean)
            .join(' ') || undefined;

        return (
          <div key={field.name} className={styles.fieldGroup}>
            <label className={styles.label} htmlFor={field.name}>
              {field.label}
              {field.isOptional && (
                <span className={styles.optionalLabel}>
                  (необов&apos;язково)
                </span>
              )}
            </label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon} aria-hidden="true">
                {field.icon}
              </span>
              <input
                id={field.name}
                type={field.type}
                className={styles.inputWithIcon}
                placeholder={field.placeholder}
                {...register(field.name, {
                  required: field.required,
                })}
                autoComplete={field.autoComplete}
                aria-invalid={hasError}
                aria-describedby={ariaDescribedBy}
              />
            </div>
            {field.description && (
              <p id={descriptionId} className={styles.fieldDescription}>
                {field.description}
              </p>
            )}
            <ErrorMessage
              errors={errors}
              name={field.name}
              render={({ message }) => (
                <p id={errorId} className={styles.error}>
                  {message}
                </p>
              )}
            />
          </div>
        );
      })}

      {/* Info hint */}
      <div id="author-form-hint" className={styles.hint}>
        <span className={styles.hintIcon} aria-hidden="true">
          <Info size={13} strokeWidth={2} />
        </span>
        <p className={styles.hintText}>
          Ці дані зберігаються локально для наступних таблиць.
        </p>
      </div>
    </fieldset>
  );
}
