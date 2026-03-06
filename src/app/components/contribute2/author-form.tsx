'use client';

import { Info, Mail, User } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import styles from './author-form.module.css';

import githubIcon from '../../icons/github.svg';
export default function AuthorForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [github, setGithub] = useState('');

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
            value={name}
            onChange={(event) => setName(event.target.value)}
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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
            value={github}
            onChange={(event) => setGithub(event.target.value)}
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
