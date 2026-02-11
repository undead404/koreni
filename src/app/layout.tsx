import type { Metadata } from 'next';

import CookieBanner from './components/cookie-banner';
import Footer from './components/footer';
import Header from './components/header';

import './globals.css';
import styles from './layout.module.css';

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
      <body>
        <div className={styles.page}>
          <Header />
          <main className={styles.main}>{children}</main>
          <Footer />
          <CookieBanner />
        </div>
      </body>
    </html>
  );
}
