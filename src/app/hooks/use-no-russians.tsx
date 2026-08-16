'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

    return () => {
      observer.disconnect();
    };
  }, []);
};

export default useNoRussians;
