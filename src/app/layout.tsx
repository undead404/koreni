import type { Metadata } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import CookieBanner from './components/cookie-banner';
import Footer from './components/footer';
import Header from './components/header';
import ErrorBoundary from './providers/error-boundary';
import NoRussians from './providers/no-russians';
import { PostHogProvider } from './providers/posthog';
import environment from './environment';

import './globals.css';
import styles from './layout.module.css';

export const metadata: Metadata = {
  applicationName: 'Корені',
  publisher: 'Корені',
  description: 'Пошук у народних генеалогічних індексах',
  metadataBase: new URL(environment.NEXT_PUBLIC_SITE),
  openGraph: {
    description: 'Пошук у народних генеалогічних індексах',
    locale: 'uk-UA',
    siteName: 'Корені',
    title: 'Корені',
    type: 'website',
    url: `/`,
  },
  title: {
    default: 'Корені',
    template: '%s | Корені',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@negativo_ua',
    description: 'Пошук у народних генеалогічних індексах',
    images: [`/icon.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="uk">
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <PostHogProvider>
            <NoRussians />
            <div className={styles.page}>
              <Header />
              <main className={styles.main}>{children}</main>
              <Footer />
              <CookieBanner />
            </div>
            <Toaster position="bottom-right" richColors />
          </PostHogProvider>
        </ErrorBoundary>
        <Script
          src="https://uptime.betterstack.com/widgets/announcement.js"
          data-id="237385"
          async
          type="text/javascript"
        ></Script>
        <Script
          src="https://descriptor-strider-ai.vercel.app/widget.js"
          data-partner-key="blkch_5dc94a37b758a30568da4b621f056deef5d32c40f66adf442bdbe942d26ce127"
          data-partner-id="koreni"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
