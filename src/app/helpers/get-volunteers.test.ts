import { beforeEach, describe, expect, it, vi } from 'vitest';

import getTablesMetadata from '@koreni/shared/get-tables-metadata';
import type { IndexationTable } from '@koreni/shared/schemas/indexation-table';

import getVolunteers from './get-volunteers';

const readPolicy = vi.hoisted(() => vi.fn());

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    default: { readFile: readPolicy, readdir: actual.readdir },
    readFile: readPolicy,
  };
});
vi.mock('@koreni/shared/get-tables-metadata');

const tables: IndexationTable[] = [
  {
    archiveItems: ['1'],
    authorEmail: ' Google@Example.com ',
    authorName: 'Автор',
    date: new Date('2024-01-01T00:00:00.000Z'),
    id: 'google-record',
    location: [0, 0],
    size: 3,
    sources: [],
    tableFilePath: 'data/csv/google-record.csv',
    tableLocale: 'uk',
    title: 'Google record',
    yearsRange: [1900],
  },
  {
    archiveItems: ['2'],
    authorEmail: 'linked@example.com',
    authorName: 'Автор',
    date: new Date('2024-01-02T00:00:00.000Z'),
    id: 'linked-record',
    location: [0, 0],
    size: 4,
    sources: [],
    tableFilePath: 'data/csv/linked-record.csv',
    tableLocale: 'uk',
    title: 'Linked record',
    yearsRange: [1901],
  },
  {
    archiveItems: ['3'],
    authorEmail: 'other@example.com',
    authorName: 'Автор',
    date: new Date('2024-01-03T00:00:00.000Z'),
    id: 'other-record',
    location: [0, 0],
    size: 5,
    sources: [],
    tableFilePath: 'data/csv/other-record.csv',
    tableLocale: 'uk',
    title: 'Other record',
    yearsRange: [1902],
  },
  {
    archiveItems: ['4'],
    authorEmail: 'unmatched@example.com',
    authorName: 'Незіставлений автор',
    date: new Date('2024-01-04T00:00:00.000Z'),
    id: 'unmatched-record',
    location: [0, 0],
    size: 6,
    sources: [],
    tableFilePath: 'data/csv/unmatched-record.csv',
    tableLocale: 'uk',
    title: 'Unmatched record',
    yearsRange: [1903],
  },
];

describe('getVolunteers email visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTablesMetadata).mockResolvedValue(tables);
  });

  it('suppresses exact normalized login and linked identities only', async () => {
    readPolicy.mockResolvedValue(
      JSON.stringify({
        mode: 'listed',
        suppressed_emails: ['google@example.com', 'LINKED@example.com'],
      }),
    );

    const volunteers = await getVolunteers();
    const author = volunteers.find(({ name }) => name === 'Автор');
    const unmatched = volunteers.find(
      ({ name }) => name === 'Незіставлений автор',
    );

    expect(author?.name).toBe('Автор');
    expect(author?.slug).toBe('avtor');
    expect(author?.emails).toBe('other@example.com');
    expect(author?.power).toBe(12);
    expect(author?.tables).toHaveLength(3);
    expect(author?.tables[0]).not.toHaveProperty('authorEmail');
    expect(author?.tables[1]).not.toHaveProperty('authorEmail');
    expect(author?.tables[2].authorEmail).toBe('other@example.com');
    expect(unmatched?.emails).toBe('unmatched@example.com');
    expect(unmatched?.tables[0].authorEmail).toBe('unmatched@example.com');
  });

  it.each([
    ['all mode', JSON.stringify({ mode: 'all' })],
    ['a missing manifest', new Error('ENOENT')],
    ['a malformed manifest', '{not-json'],
  ])(
    'fails closed for %s and preserves non-email volunteer data',
    async (_description, policy) => {
      readPolicy.mockImplementation(() =>
        policy instanceof Error
          ? Promise.reject(policy)
          : Promise.resolve(policy),
      );
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const volunteers = await getVolunteers();

      expect(volunteers).toHaveLength(2);
      expect(volunteers[0].emails).toBe('');
      expect(volunteers[0].power).toBe(12);
      expect(volunteers[0].tables).toHaveLength(3);
      for (const volunteer of volunteers) {
        for (const table of volunteer.tables) {
          expect(table).not.toHaveProperty('authorEmail');
        }
      }
      consoleError.mockRestore();
    },
  );
});
