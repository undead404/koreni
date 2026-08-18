'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const useNoRussians = () => {
  const router = useRouter();
  const pathname = usePathname();
  const langReference = useRef<string | null>(null);
  const preferredLanguagesReference = useRef<readonly string[]>([]);
  const hasInitializedReference = useRef(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof document === 'undefined')
      return;

    // Initialize on first run
    if (!hasInitializedReference.current) {
      preferredLanguagesReference.current = navigator.languages;
      const htmlElement = document.documentElement;
      langReference.current = htmlElement.getAttribute('lang');
      hasInitializedReference.current = true;

      // Check initial language
      if (langReference.current && langReference.current.includes('ru')) {
        router.push('/not-welcome');
        return;
      }

      if (preferredLanguagesReference.current.length > 0) {
        const ruPos = preferredLanguagesReference.current.findIndex((l) =>
          l.startsWith('ru'),
        );
        if (ruPos === 0) {
          router.push('/not-welcome');
          return;
        }
      }
    }

    const htmlElement = document.documentElement;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'lang'
        ) {
          const newLang = htmlElement.getAttribute('lang');
          langReference.current = newLang;
          if (newLang && newLang.includes('ru')) {
            router.push('/not-welcome');
          }
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
  }, [router, pathname]);
};

export default useNoRussians;
