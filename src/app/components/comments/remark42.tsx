'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

interface Remark42Properties {
  siteId?: string;
  host: string;
}

const getPreferredTheme = (): 'light' | 'dark' => {
  if (typeof globalThis.matchMedia !== 'function') {
    return 'light';
  }
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export default function Remark42({
  host,
  siteId = 'remark',
}: Remark42Properties) {
  const remark42ElementReference = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const handleThemeChange = useCallback((theme: 'light' | 'dark') => {
    globalThis.REMARK42?.changeTheme(theme);
  }, []);

  useEffect(() => {
    if (typeof globalThis.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaQueryChange = (event: { matches: boolean }) => {
      handleThemeChange(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleMediaQueryChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
    };
  }, [handleThemeChange]);

  useEffect(() => {
    const config = {
      host,
      locale: 'ua',
      site_id: siteId,
      theme: getPreferredTheme(),
      url: `${globalThis.location?.origin ?? ''}${pathname}`,
      components: ['embed'],
    };

    globalThis.remark_config = config;

    if (globalThis.REMARK42) {
      globalThis.REMARK42.createInstance({
        node: remark42ElementReference.current,
        ...config,
      });
    } else {
      const script = document.createElement('script');
      script.src = `${host}/web/embed.js`;
      script.async = true;
      script.defer = true;
      document.head.append(script);
    }

    return () => {
      globalThis.REMARK42?.destroy();
    };
  }, [host, pathname, siteId]);

  return <div id="remark42" ref={remark42ElementReference} />;
}
