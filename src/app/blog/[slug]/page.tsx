import clsx from 'clsx';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import Comments from '@/app/components/comments/comments';
import renderMarkdown from '@/app/helpers/render-markdown';

import { getBlogArticle, getBlogArticles } from '../blog-content';

import styles from './page.module.css';

type BlogArticlePageProperties = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const articles = await getBlogArticles();
  return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProperties): Promise<Metadata> {
  const { slug } = await params;
  const article = await getBlogArticle(slug);
  if (!article) notFound();

  return {
    title: article.title,
    description: article.description,
    authors: [{ name: article.author }],
    alternates: { canonical: `/blog/${article.slug}/` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.description,
      url: `/blog/${article.slug}/`,
      publishedTime: article.date,
      authors: [article.author],
    },
    twitter: {
      title: article.title,
      description: article.description,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: BlogArticlePageProperties) {
  const { slug } = await params;
  const article = await getBlogArticle(slug);
  if (!article) notFound();

  const content = await renderMarkdown(Buffer.from(article.content));
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: article.title,
    description: article.description,
    author: { '@type': 'Person', name: article.author },
    datePublished: article.date,
    url: `/blog/${article.slug}/`,
  });

  return (
    <>
      <article className={styles.article}>
        <Link href="/blog/">← Усі статті</Link>
        <header>
          <h1>{article.title}</h1>
          <p className={styles.meta}>
            {article.author} ·{' '}
            {new Intl.DateTimeFormat('uk-UA', {
              dateStyle: 'long',
              timeZone: 'UTC',
            }).format(new Date(`${article.date}T00:00:00Z`))}
          </p>
          {article.tags && (
            <ul className={clsx(styles.tags, 'no-disc')} aria-label="Теги">
              {article.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          )}
        </header>
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </article>
      <Comments />
      <script type="application/ld+json">{jsonLd}</script>
    </>
  );
}
