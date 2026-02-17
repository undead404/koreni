'use client';

import { usePathname, useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';

import { initBugsnag } from '../services/bugsnag';

import styles from './use-no-russians.module.css';

let isToastShown = false;

const useNoRussians = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [lang, setLang] = useState<string | null>(null);
  const [preferredLangs, setPreferredLangs] = useState<readonly string[]>([]);

  useEffect(() => {
    if (lang && lang.includes('ru')) {
      router.push('/not-welcome');
    }
  }, [router, pathname, lang]);

  useEffect(() => {
    if (preferredLangs.length === 0) {
      return;
    }
    const ruPos = preferredLangs.findIndex((l) => l.startsWith('ru'));
    if (ruPos === -1) {
      return;
    }

    if (ruPos === 0) {
      // Primary language is Russian
      router.push('/not-welcome');
    } else if (!isToastShown) {
      // Secondary language is Russian
      isToastShown = true;
      setTimeout(() => {
        isToastShown = false;
      }, 20_000);

      // Light ukrainization toast
      import('sonner')
        .then(({ toast }) =>
          toast.error('Лагідна українізація!', {
            action: (
              <a
                className={styles.help}
                href="https://support.google.com/accounts/answer/32047?hl=uk"
              >
                Як це виправити?
              </a>
            ),
            classNames: {
              content: styles.content,
              icon: styles.icon,
              toast: styles.toast,
            },
            description: `Ви знали, що ваш браузер використовує російську мову в якості запасної?`,
            duration: 20_000,
            icon: '🇺🇦',
          }),
        )
        .catch((error) => {
          console.error(error);
          initBugsnag().notify(error as Error);
          posthog.captureException(error);
        });
    }
  }, [pathname, preferredLangs, router]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof document === 'undefined')
      return;
    setPreferredLangs(navigator.languages);

    const htmlElement = document.documentElement;
    setLang(htmlElement.getAttribute('lang'));

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'lang'
        ) {
          setLang(htmlElement.getAttribute('lang'));
        }
      }
    });

    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['lang'],
    });

    return () => observer.disconnect();
  }, []);
};

export default useNoRussians;
