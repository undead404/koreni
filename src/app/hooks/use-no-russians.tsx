'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import styles from './use-no-russians.module.css';

const useNoRussians = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [lang, setLang] = useState<string | null>(null);
  const [preferredLangs, setPreferredLangs] = useState<readonly string[]>([]);

  useEffect(() => {
    if (lang) {
      if (lang.includes('ru')) {
        router.push('/not-welcome');
      } else if (!lang.includes('uk')) {
        // foreigner; fine
      }
    }
  }, [router, pathname, lang]);

  useEffect(() => {
    if (preferredLangs.length === 0) {
      return;
    }
    const ruPos = preferredLangs.findIndex((l) => l.startsWith('ru'));
    if (ruPos === -1) {
      // all good
      return;
    }

    const ukPos = preferredLangs.findIndex((l) => l.startsWith('uk'));

    if (ukPos === -1) {
      // no ukrainian, only russian
      router.push('/not-welcome');
    } else if (ruPos > ukPos) {
      // light ukrainization
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
      });
    } else if (ukPos > ruPos) {
      // hard ukrainization
      router.push('/not-welcome');
    }
  }, [pathname, preferredLangs]);

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
      attributes: true, // Watch for attribute changes
      attributeFilter: ['lang'], // Only track 'lang' attribute
    });

    return () => observer.disconnect();
  }, []);
};

export default useNoRussians;
