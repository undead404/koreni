'use client';

import Giscus, { type Repo } from '@giscus/react';

import environment from '../environment';

import styles from './comments.module.css';

export default function Comments() {
  if (!environment.NEXT_PUBLIC_GISCUS_REPO_ID) {
    return null;
  }
  if (!environment.NEXT_PUBLIC_GISCUS_CATEGORY_ID) {
    return null;
  }
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Обговорення та запитання</h2>
      <Giscus
        id="comments"
        repo={environment.NEXT_PUBLIC_GITHUB_REPO as Repo}
        repoId={environment.NEXT_PUBLIC_GISCUS_REPO_ID}
        category="Announcements"
        categoryId={environment.NEXT_PUBLIC_GISCUS_CATEGORY_ID}
        mapping="pathname" // Найважливіше: прив'язка до URL
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="preferred_color_scheme" // Автоматично підтягне темну/світлу тему ОС
        lang="uk" // Український інтерфейс
        loading="lazy"
      />
    </div>
  );
}
