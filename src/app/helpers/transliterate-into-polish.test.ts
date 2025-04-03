import { describe, expect, it } from 'vitest';

import transliterateIntoPolish from './transliterate-into-polish';

describe('transliterateIntoPolish', () => {
  it('should transliterate a Ukrainian surname', () => {
    const input = 'Шевченко';
    const expected = 'Szewczenko';
    expect(transliterateIntoPolish(input)).toBe(expected);
  });

  it('should transliterate a Russian surname', () => {
    const input = 'Достоевский';
    const expected = 'Dostoewskyj';
    expect(transliterateIntoPolish(input)).toBe(expected);
  });

  it('should transliterate a Ukrainian surname with a place', () => {
    const input = 'Шевченко з Києва';
    const expected = 'Szewczenko z Kyjewa';
    expect(transliterateIntoPolish(input)).toBe(expected);
  });

  it('should transliterate a Russian surname with a place', () => {
    const input = 'Достоевский из Москвы';
    const expected = 'Dostoewskyj yz Moskwy';
    expect(transliterateIntoPolish(input)).toBe(expected);
  });

  it('should transliterate a Ukrainian surname with a forename', () => {
    const input = 'Тарас Шевченко';
    const expected = 'Taras Szewczenko';
    expect(transliterateIntoPolish(input)).toBe(expected);
  });

  it('should transliterate a Russian surname with a forename', () => {
    const input = 'Фёдор Достоевский';
    const expected = 'Fjodor Dostoewskyj';
    expect(transliterateIntoPolish(input)).toBe(expected);
  });

  it('should handle mixed Ukrainian and Russian text', () => {
    const input = 'Тарас Шевченко і Фёдор Достоевский';
    const expected = 'Taras Szewczenko i Fjodor Dostoewskyj';
    expect(transliterateIntoPolish(input)).toBe(expected);
  });

  it('should handle text with non-Cyrillic characters', () => {
    const input = 'Тарас Шевченко - великий поет';
    const expected = 'Taras Szewczenko - welykyj poet';
    expect(transliterateIntoPolish(input)).toBe(expected);
  });

  it('should handle empty string', () => {
    const input = '';
    const expected = '';
    expect(transliterateIntoPolish(input)).toBe(expected);
  });

  it('should handle text with numbers and symbols', () => {
    const input = 'Фёдор Достоевский 1821-1881';
    const expected = 'Fjodor Dostoewskyj 1821-1881';
    expect(transliterateIntoPolish(input)).toBe(expected);
  });
});
