import type { Metadata } from 'next';
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import Script from 'next/script';

import Header from './components/header';
import SimpleAnalytics from './components/simple-analytics';

import './globals.css';
import styles from './layout.module.css';

import githubIcon from './assets/github.svg';

export const metadata: Metadata = {
  title: 'Корені',
  description: 'Пошук у народних генеалогічних індексах',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <head>
        <Script id="sa-placeholder">{`window.sa_event=window.sa_event||function(){var a=[].slice.call(arguments);window.sa_event.q?window.sa_event.q.push(a):window.sa_event.q=[a]};`}</Script>
      </head>
      <body>
        <div className={styles.page}>
          <Header />
          <main className={styles.main}>{children}</main>
          <footer className={styles.footer}>
            <p>
              Дані поширюються за <Link href="/license">ліцензією ODbL</Link>.
              Код доступний на{' '}
              <a
                href="https://github.com/undead404/koreni"
                target="_blank"
                rel="noopener noreferrer"
                title="undead404/koreni на GitHub"
              >
                GitHub&nbsp;
                <Image
                  src={githubIcon as StaticImageData}
                  alt="GitHub logo"
                  className="filter-inverted"
                  height={20}
                  width={20}
                />
              </a>
              .
            </p>
          </footer>
        </div>
        <SimpleAnalytics />
      </body>
    </html>
  );
}
