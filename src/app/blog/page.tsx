import clsx from 'clsx';
import type { Metadata } from 'next';
import Link from 'next/link';

import { getBlogArticles } from './blog-content';

import styles from './page.module.css';

const DESCRIPTION =
  'Технічні нотатки про те, як працюють Корені, як ми працюємо з даними та які рішення приймаємо під час розвитку проєкту.';

export const metadata: Metadata = {
  title: 'Блог',
  description: DESCRIPTION,
  alternates: { canonical: '/blog/' },
  openGraph: {
    title: 'Блог',
    description: DESCRIPTION,
    url: '/blog/',
  },
  twitter: {
    title: 'Блог',
    description: DESCRIPTION,
  },
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function BlogPage() {
  const articles = await getBlogArticles();

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h1>Блог</h1>
        <p>{DESCRIPTION}</p>
      </header>
      {articles.length > 0 ? (
        <div className={styles.list}>
          {articles.map((article) => (
            <article className={styles.card} key={article.slug}>
              <p className={styles.date}>{formatDate(article.date)}</p>
              <h2>
                <Link href={`/blog/${article.slug}/`}>{article.title}</Link>
              </h2>
              <p>{article.description}</p>
              {article.tags && (
                <ul className={clsx(styles.tags, 'no-disc')} aria-label="Теги">
                  {article.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p>Поки що немає опублікованих статей.</p>
      )}
    </section>
  );
}
