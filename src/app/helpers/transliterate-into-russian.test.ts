import { describe, expect, it } from 'vitest';

import transliterateIntoRussian from './transliterate-into-russian';

describe('transliterateIntoRussian', () => {
  it('should return Cyrillic script unchanged', () => {
    expect(transliterateIntoRussian('Привет Мир')).toBe('Привет Мир');
  });

  it('should transliterate Latin script to Russian Cyrillic script', () => {
    expect(transliterateIntoRussian('Hello World')).toBe('Хелло Ворлд');
  });

  it('should handle special cases at the beginning of the word', () => {
    expect(transliterateIntoRussian('Yuri')).toBe('Юри');
    expect(transliterateIntoRussian('Yaroslav')).toBe('Ярослав');
    expect(transliterateIntoRussian('Yulia')).toBe('Юля');
    expect(transliterateIntoRussian('Ivan')).toBe('Иван');
  });

  it('should handle digraphs correctly', () => {
    expect(transliterateIntoRussian('Philosophy')).toBe('Философы');
    expect(transliterateIntoRussian('Shchuka')).toBe('Щука');
    expect(transliterateIntoRussian('Zhukov')).toBe('Жуков');
    expect(transliterateIntoRussian('Charkov')).toBe('Чарков');
  });

  it('should handle "yo" and "yu" in the middle of a word', () => {
    expect(transliterateIntoRussian('Belyuk')).toBe('Белюк');
    expect(transliterateIntoRussian('Kostyuk')).toBe('Костюк');
    expect(transliterateIntoRussian('Lyashenko')).toBe('Ляшенко');
  });

  it('should handle surnames with places or first names', () => {
    expect(transliterateIntoRussian('Andrey Shevchenko')).toBe(
      'Андрей Шевченко',
    );
    expect(transliterateIntoRussian('Petr Poroshenko')).toBe('Петр Порошенко');
    expect(transliterateIntoRussian('Sergey Petrovichev')).toBe(
      'Сергей Петровичев',
    );
  });
});
