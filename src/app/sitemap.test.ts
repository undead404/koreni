import { describe, expect, it, vi } from 'vitest';

import sitemap from './sitemap';

vi.mock('@koreni/shared/get-tables-metadata', () => ({
  default: vi.fn().mockResolvedValue([
    {
      authorName: 'Test Author',
      date: new Date('2026-01-01'),
      id: 'test-table',
      size: 10,
    },
  ]),
}));

vi.mock('./environment', () => ({
  default: {
    NEXT_PUBLIC_SITE: 'https://test.site',
  },
}));

describe('Sitemap', () => {
  it('should not contain /account, /account/login, /account/transcribe, or /transcribe URLs', async () => {
    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    for (const url of urls) {
      expect(url).not.toContain('/account');
      expect(url).not.toContain('/transcribe');
    }
  });
});
