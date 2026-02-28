'use client';
import { ErrorMessage } from '@hookform/error-message';
import { useFormContext } from 'react-hook-form';

import type { ContributeFormValues } from './types';

import styles from './contribute-form.module.css';

export default function AuthorFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ContributeFormValues>();

  return (
    <>
      <div className={styles.field}>
        <label htmlFor="authorName" className={styles.label}>
          Ім'я автора індексації (транскрибування)
        </label>
        <p id="authorName-desc" className={styles.description}>
          Бажано використовувати справжнє ім'я, але якщо не хочете – вигадайте
          постійний псевдонім.
        </p>
        <input
          autoComplete="name"
          id="authorName"
          type="text"
          {...register('authorName', {
            required: true,
            minLength: 2,
            maxLength: 128,
          })}
          aria-describedby="authorName-desc"
          className={styles.input}
        />
        <ErrorMessage errors={errors} name="authorName" />
      </div>

      <div className={styles.field}>
        <label htmlFor="authorEmail" className={styles.label}>
          Email автора
        </label>
        <p id="authorEmail-desc" className={styles.description}>
          Необов'язково, але варто заповнити, аби зацікавлені читачі індексації
          могли з Вами зв'язатися.
        </p>
        <input
          autoComplete="email"
          id="authorEmail"
          type="email"
          {...register('authorEmail')}
          aria-describedby="authorEmail-desc"
          className={styles.input}
        />
        <ErrorMessage errors={errors} name="authorEmail" />
      </div>

      <div className={styles.field}>
        <label htmlFor="authorGithubUsername" className={styles.label}>
          Ім'я користувача на GitHub (необов'язково)
        </label>
        <p id="authorGithubUsername-desc" className={styles.description}>
          Введіть, якщо хочете отримувати сповіщення про розгляд і додання цієї
          таблиці на Корені.
        </p>
        <input
          autoComplete="username"
          id="authorGithubUsername"
          type="text"
          {...register('authorGithubUsername')}
          aria-describedby="authorGithubUsername-desc"
          className={styles.input}
        />
        <ErrorMessage errors={errors} name="authorGithubUsername" />
      </div>
    </>
  );
}
