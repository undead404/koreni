import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Image from 'next/image';
import Script from 'next/script';

import Header from './components/header';
import SimpleAnalytics from './components/simple-analytics';

import './globals.css';
import styles from './layout.module.css';

import githubIcon from './github.svg';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className={styles.page}>
          <Header />
          <main className={styles.main}>{children}</main>
          <footer className={styles.footer}>
            <a
              href="https://github.com/undead404/koreni"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                alt="undead404/koreni на GitHub"
                className={styles.githubIcon}
                height={24}
                src={githubIcon}
                title="undead404/koreni на GitHub"
                width={24}
              />
            </a>
          </footer>
        </div>
        <SimpleAnalytics />
      </body>
    </html>
  );
}
