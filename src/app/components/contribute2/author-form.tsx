'use client';

import { Info, Mail, User } from 'lucide-react';
import Image from 'next/image';
import { useFormContext } from 'react-hook-form';

import styles from './author-form.module.css';

import githubIcon from '../../icons/github.svg';
export default function AuthorForm() {
  const { register } = useFormContext();
  return (
    <div className={styles.wrapper}>
      {/* Name */}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="author-name">
          Ім&apos;я
        </label>
        <div className={styles.inputWrap}>
          <span className={styles.inputIcon} aria-hidden="true">
            <User size={14} strokeWidth={2} />
          </span>
          <input
            id="author-name"
            type="text"
            className={styles.inputWithIcon}
            placeholder="Іван Мельник"
            {...register('authorName', {
              required: true,
            })}
            autoComplete="name"
          />
        </div>
      </div>

      {/* Email */}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="author-email">
          Електронна пошта
        </label>
        <div className={styles.inputWrap}>
          <span className={styles.inputIcon} aria-hidden="true">
            <Mail size={14} strokeWidth={2} />
          </span>
          <input
            id="author-email"
            type="email"
            className={styles.inputWithIcon}
            placeholder="ivanmelnyk@gmail.com"
            {...register('authorEmail')}
            autoComplete="email"
          />
        </div>
      </div>

      {/* GitHub Username */}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="author-github">
          Обліковий запис GitHub
        </label>
        <div className={styles.inputWrap}>
          <span className={styles.inputIcon} aria-hidden="true">
            <Image src={githubIcon} alt="GitHub" width={14} height={14} />
          </span>
          <input
            id="author-github"
            type="text"
            className={styles.inputWithIcon}
            placeholder="janedoe"
            {...register('authorGithubUsername')}
            autoComplete="username"
          />
        </div>
      </div>

      {/* Info hint */}
      <div className={styles.hint}>
        <span className={styles.hintIcon} aria-hidden="true">
          <Info size={13} strokeWidth={2} />
        </span>
        <p className={styles.hintText}>
          Ці дані зберігаються локально для наступних таблиць.
        </p>
      </div>
    </div>
  );
}
