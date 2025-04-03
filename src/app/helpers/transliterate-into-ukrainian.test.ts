import { describe, expect, it } from 'vitest';

import transliterateIntoUkrainian from './transliterate-into-ukrainian';

describe('transliterateIntoUkrainian', () => {
  it('should return Cyrillic script unchanged', () => {
    expect(transliterateIntoUkrainian('Привіт Світ')).toBe('Привіт Світ');
  });

  it('should transliterate Latin script to Ukrainian Cyrillic script', () => {
    expect(transliterateIntoUkrainian('Hello World')).toBe('Гелло Ворлд');
  });

  it('should handle special cases at the beginning of the word', () => {
    expect(transliterateIntoUkrainian('Yurii')).toBe('Юрій');
    expect(transliterateIntoUkrainian('Yaroslav')).toBe('Ярослав');
    expect(transliterateIntoUkrainian('Yuliia')).toBe('Юлія');
    expect(transliterateIntoUkrainian('Ivan')).toBe('Іван');
  });

  it('should handle digraphs correctly', () => {
    expect(transliterateIntoUkrainian('Philosophy')).toBe('Філософи');
    expect(transliterateIntoUkrainian('Shchuka')).toBe('Щука');
    expect(transliterateIntoUkrainian('Zghushchuvach')).toBe('Згущувач');
    expect(transliterateIntoUkrainian('Kharkiv')).toBe('Харків');
  });

  it('should handle "iu" and "ia" in the middle of a word', () => {
    expect(transliterateIntoUkrainian('Biliuk')).toBe('Білюк');
    expect(transliterateIntoUkrainian('Kostiuk')).toBe('Костюк');
    expect(transliterateIntoUkrainian('Liashenko')).toBe('Ляшенко');
  });

  it('should handle surnames with places or first names', () => {
    expect(transliterateIntoUkrainian('Andrii Shevchenko')).toBe(
      'Андрій Шевченко',
    );
    expect(transliterateIntoUkrainian('Petro Poroshenko')).toBe(
      'Петро Порошенко',
    );
    expect(transliterateIntoUkrainian('Volodymyr Zelenskyi')).toBe(
      'Володимир Зеленский',
    );
    expect(transliterateIntoUkrainian('Kyiv')).toBe('Кийв');
  });
});
