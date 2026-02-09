'use client';

import posthog from 'posthog-js';
import { useCallback } from 'react';

const SITES_MAPPING: Record<string, string> = {
  'kylykyiv.pp.ua': 'Індекс мешканців містечка Киликиїв',
  'docs.google.com': 'Google Docs',
};

export default function SourceLink({ href }: { href: string }) {
  try {
    const url = new URL(href);
    const host = url.host;

    const handleClick = useCallback(() => {
      posthog.capture('source_link_clicked', {
        source_url: url.toString(),
        source_host: host,
        source_name: SITES_MAPPING[host] || host,
      });
    }, [host, url]);

    return (
      <a href={url.toString()} target="_blank" onClick={handleClick}>
        {SITES_MAPPING[host] || host}
      </a>
    );
  } catch (error) {
    console.error(error);
    posthog.captureException(error as Error);
    return href;
  }
}
