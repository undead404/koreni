import { describe, expect, it } from 'vitest';

import { createArchivalProvenance } from './format-json-ld-metadata';

describe('createArchivalProvenance', () => {
  it('includes the website and Wikidata URL when a website exists', () => {
    const archives = new Map([
      [
        'ДАХмО',
        {
          shortTitle: 'ДАХмО',
          title: 'Державний архів Хмельницької області',
          website: 'https://dahmo.gov.ua/',
          wikidataId: 'Q4146784',
        },
      ],
    ]);

    expect(createArchivalProvenance('ДАХмО-1-2-3', archives)).toStrictEqual({
      '@type': 'ArchiveComponent',
      identifier: 'ДАХмО-1-2-3',
      name: 'Фонд 1, опис 2, справа 3',
      holdingArchive: {
        '@type': 'ArchiveOrganization',
        name: 'Державний архів Хмельницької області',
        sameAs: [
          'https://dahmo.gov.ua/',
          'https://www.wikidata.org/wiki/Q4146784',
        ],
      },
    });
  });

  it('excludes a missing website from sameAs', () => {
    const archives = new Map([
      [
        'ДААРК',
        {
          shortTitle: 'ДААРК',
          title: 'Державний архів в Автономній республіці Крим',
          website: null,
          wikidataId: 'Q12100416',
        },
      ],
    ]);

    expect(createArchivalProvenance('ДААРК-1-2-3', archives)).toStrictEqual({
      '@type': 'ArchiveComponent',
      identifier: 'ДААРК-1-2-3',
      name: 'Фонд 1, опис 2, справа 3',
      holdingArchive: {
        '@type': 'ArchiveOrganization',
        name: 'Державний архів в Автономній республіці Крим',
        sameAs: ['https://www.wikidata.org/wiki/Q12100416'],
      },
    });
  });
});
