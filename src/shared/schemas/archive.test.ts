import { describe, expect, it } from 'vitest';

import { archiveSchema } from './archive';

describe('archiveSchema', () => {
  it('validates archive metadata', () => {
    expect(
      archiveSchema.parse({
        shortTitle: 'ДАХмО',
        title: 'Державний архів Хмельницької області',
        website: 'https://dahmo.gov.ua/',
        wikidataId: 'Q4146784',
      }),
    ).toEqual({
      shortTitle: 'ДАХмО',
      title: 'Державний архів Хмельницької області',
      website: 'https://dahmo.gov.ua/',
      wikidataId: 'Q4146784',
    });
  });

  it('rejects invalid archive metadata', () => {
    expect(() =>
      archiveSchema.parse({
        shortTitle: 'ДАХмО',
        title: 'Державний архів Хмельницької області',
        website: 'not-a-url',
        wikidataId: 'not-a-wikidata-id',
      }),
    ).toThrow();
  });
});
