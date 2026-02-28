import type { UseFormRegister } from 'react-hook-form';

import type { ContributeFormValues } from './types';

import styles from './contribute-form.module.css';

interface AuthorFieldsProperties {
  isSubmitting: boolean;
  register: UseFormRegister<ContributeFormValues>;
}

export default function AuthorFields({
  isSubmitting,
  register,
}: AuthorFieldsProperties) {
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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
          id="authorEmail"
          type="email"
          {...register('authorEmail')}
          aria-describedby="authorEmail-desc"
          className={styles.input}
        />
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
          disabled={isSubmitting}
          id="authorGithubUsername"
          type="text"
          {...register('authorGithubUsername')}
          aria-describedby="authorGithubUsername-desc"
          className={styles.input}
        />
      </div>
    </>
  );
}
