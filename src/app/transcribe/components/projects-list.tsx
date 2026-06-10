'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import getProjects from '../api/get-projects';
import { type Project } from '../schemata';

import styles from './projects-list.module.css';

function formatProjectDate(dateString: string): string | null {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => {
        toast.error('Помилка завантаження проєктів');
      });
  }, []);

  return (
    <section>
      <h1 className={styles.title}>Проєкти</h1>
      <div className={styles.grid}>
        {projects.map((project) => {
          const formattedDate = formatProjectDate(project.created_at);

          return (
            <Link
              href={`/transcribe/workspace?projectId=${project.id}`}
              key={project.id}
              className={styles.cardLink}
            >
              <article className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>{project.title}</h2>
                  <span className={styles.arrow}>→</span>
                </div>
                {formattedDate && (
                  <div className={styles.cardDate}>{formattedDate}</div>
                )}
              </article>
            </Link>
          );
        })}
      </div>
      {projects.length === 0 && (
        <div className={styles.emptyState}>
          <p>Немає проєктів</p>
        </div>
      )}
    </section>
  );
}
