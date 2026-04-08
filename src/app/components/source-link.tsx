'use client';

import { usePostHog } from 'posthog-js/react';
import { useCallback, useMemo } from 'react';

const SITES_MAPPING: Record<string, string> = {
  'docs.google.com': 'Google Docs',
  'jbc.bj.uj.edu.pl': 'Jagiellońska Biblioteka Cyfrowa',
  'kylykyiv.pp.ua': 'Індекс мешканців містечка Киликиїв',
  'onedrive.live.com': 'OneDrive',
  'uk.wikisource.org': 'Вікіджерела',
  'drive.google.com': 'Google Drive',
  'www.familysearch.org': 'FamilySearch',
};

export default function SourceLink({ href }: { href: string }) {
  const posthog = usePostHog();
  const url = useMemo(() => {
    try {
      return new URL(href);
    } catch (error) {
      console.error(error);
      posthog.captureException(error as Error);
      return null;
    }
  }, [href, posthog]);
  const handleClick = useCallback(() => {
    posthog.capture('source_link_clicked', {
      source_url: url!.toString(),
      source_host: url!.host,
      source_name: SITES_MAPPING[url!.host] || url!.host,
    });
  }, [posthog, url]);
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
