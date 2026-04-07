import type { Metadata } from 'next';
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
  authors: [
    {
      name: 'Віталій Перегончук',
      url: 'https://www.linkedin.com/in/vitalii-perehonchuk-10570693/',
    },
  ],
  creator: 'Віталій Перегончук',
  description: 'Пошук у народних генеалогічних індексах',
  keywords: [
    'Корені',
    'генеалогія',
    'українська генеалогія',
    'родовід',
    'Віталій Перегончук',
    'проєкт',
  ],
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
        <script
          src="https://uptime.betterstack.com/widgets/announcement.js"
          data-id="237385"
          async
          type="text/javascript"
        ></script>
      </body>
    </html>
  );
}
