import type { Metadata } from 'next';
import { Toaster } from 'sonner';

import CookieBanner from './components/cookie-banner';
import Footer from './components/footer';
import Header from './components/header';
import ErrorBoundary from './providers/error-boundary';
import NoRussians from './providers/no-russians';

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
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <NoRussians />
          <div className={styles.page}>
            <Header />
            <main className={styles.main}>{children}</main>
            <Footer />
            <CookieBanner />
          </div>
          <Toaster position="bottom-right" richColors />
        </ErrorBoundary>
      </body>
    </html>
  );
}
