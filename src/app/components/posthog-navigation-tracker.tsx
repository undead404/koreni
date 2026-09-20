'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

export default function PostHogNavigationTracker() {
  const pathname = usePathname();
  const searchParameters = useSearchParams();
  const posthog = usePostHog();
  useEffect(() => {
    if (!pathname || posthog.has_opted_in_capturing()) {
      return;
    }

    let url = origin + pathname;
    if (searchParameters.toString()) {
      url += `?${searchParameters.toString()}`;
    }
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, posthog, searchParameters]);
  return null;
}
