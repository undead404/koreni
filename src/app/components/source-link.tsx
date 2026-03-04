'use client';

import posthog from 'posthog-js';
import { useCallback, useMemo } from 'react';

const SITES_MAPPING: Record<string, string> = {
  'docs.google.com': 'Google Docs',
  'kylykyiv.pp.ua': 'Індекс мешканців містечка Киликиїв',
  'onedrive.live.com': 'OneDrive',
  'uk.wikisource.org': 'Вікіджерела',
};

export default function SourceLink({ href }: { href: string }) {
  const url = useMemo(() => {
    try {
      return new URL(href);
    } catch (error) {
      console.error(error);
      posthog.captureException(error as Error);
      return null;
    }
  }, [href]);
  const handleClick = useCallback(() => {
    posthog.capture('source_link_clicked', {
      source_url: url!.toString(),
      source_host: url!.host,
      source_name: SITES_MAPPING[url!.host] || url!.host,
    });
  }, [url]);
  if (!url) return href;
  return (
    <a
      href={url.toString()}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
    >
      {SITES_MAPPING[url.host] || url.host}
    </a>
  );
}
