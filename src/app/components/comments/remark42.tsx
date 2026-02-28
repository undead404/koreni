'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

interface Remark42Properties {
  siteId?: string;
  host: string;
}

export default function Remark42({
  host,
  siteId = 'remark',
}: Remark42Properties) {
  const remark42ElementReference = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const handleThemeChange = useCallback((theme: 'light' | 'dark') => {
    if (globalThis.REMARK42) {
      globalThis.REMARK42.changeTheme(theme);
    } else {
      console.warn('REMARK42 is not loaded');
    }
  }, []);

  useEffect(() => {
    // Handle theme change
    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaQueryChange = (event: MediaQueryListEvent) => {
      handleThemeChange(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleMediaQueryChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
    };
  }, [handleThemeChange]);

  useEffect(() => {
    // 1. Define configuration
    globalThis.remark_config = {
      host: host,
      locale: 'ua',
      site_id: siteId,
      theme: globalThis.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
      url: globalThis.location.origin + pathname,
      components: ['embed'],
    };

    // 2. Implementation of the Remark42 loader
    const loadRemark42 = () => {
      if (globalThis.REMARK42) {
        // If already loaded, just hit the re-initialization
        globalThis.REMARK42.createInstance({
          node: remark42ElementReference.current,
          ...globalThis.remark_config,
        });
      } else {
        // First load
        const script = document.createElement('script');
        script.src = `${host}/web/embed.js`;
        script.async = true;
        script.defer = true;
        document.head.append(script);
      }
    };

    loadRemark42();

    // 3. Cleanup: destroy instance on unmount to prevent memory leaks
    return () => {
      if (globalThis.REMARK42) {
        globalThis.REMARK42.destroy();
      }
    };
  }, [host, pathname, siteId]); // Re-run when the page path changes

  return <div id="remark42" ref={remark42ElementReference} />;
}
