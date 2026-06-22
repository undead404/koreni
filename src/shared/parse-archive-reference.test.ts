import { describe, expect, it } from 'vitest';

import parseArchiveReference from './parse-archive-reference';

describe('parseArchiveReference', () => {
  it('parses standard 3-dash form', () => {
    expect(parseArchiveReference('ДАКО-384-10-242')).toStrictEqual({
      archive: 'ДАКО',
      fond: '384',
      opys: '10',
      sprava: '242',
      raw: 'ДАКО-384-10-242',
    });
  });

  it('parses fond with cyrillic letter prefix', () => {
    expect(parseArchiveReference('ДАХеО-Р2588-3-1')).toStrictEqual({
      archive: 'ДАХеО',
      fond: 'Р2588',
      opys: '3',
      sprava: '1',
      raw: 'ДАХеО-Р2588-3-1',
    });
  });

  it('parses sprava with trailing cyrillic letter', () => {
    const result = parseArchiveReference('ДАХеО-Р3968-1-83а');
    expect(result.sprava).toBe('83а');
  });

  it('parses opys containing letters', () => {
    const result = parseArchiveReference('ДАКрО-П5907-2р-');
    expect(result.archive).toBe('ДАКрО');
    expect(result.fond).toBe('П5907');
    expect(result.opys).toBe('2р');
    expect(result.sprava).toBe('');
  });

  it('parses empty sprava', () => {
    const result = parseArchiveReference('ДАКО-384-15-');
    expect(result.sprava).toBe('');
    expect(result.fond).toBe('384');
  });

  it('parses space as first separator', () => {
    expect(parseArchiveReference('ДАХмО 315-1-8563')).toStrictEqual({
      archive: 'ДАХмО',
      fond: '315',
      opys: '1',
      sprava: '8563',
      raw: 'ДАХмО 315-1-8563',
    });
  });

  it('parses fond with separate-letter prefix (4 dashes)', () => {
    expect(parseArchiveReference('ДАВіО-Р-6023-1-')).toStrictEqual({
      archive: 'ДАВіО',
      fond: 'Р6023',
      opys: '1',
      sprava: '',
      raw: 'ДАВіО-Р-6023-1-',
    });
  });

  it('returns unparsed for foreign archives', () => {
    const result = parseArchiveReference('AGAD 298/151');
    expect(result.archive).toBe('');
    expect(result.raw).toBe('AGAD 298/151');
  });

  it('returns unparsed for free-text references', () => {
    const result = parseArchiveReference('див. джерела');
    expect(result.archive).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(parseArchiveReference('  ДАКО-384-10-242  ').raw).toBe(
      'ДАКО-384-10-242',
    );
  });
});
