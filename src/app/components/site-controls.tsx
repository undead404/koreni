'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface SiteControlsProperties {
  children: ReactNode;
}

export default function SiteControls({ children }: SiteControlsProperties) {
  const pathname = usePathname();

  if (pathname.replace(/\/+$/, '') === '/not-welcome') {
    return null;
  }

  return children;
}
