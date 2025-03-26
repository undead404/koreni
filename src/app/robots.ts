import type { MetadataRoute } from 'next';

import environment from './environment';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${environment.NEXT_PUBLIC_SITE}/sitemap.xml`,
  };
}
