import { describe, expect, it } from 'vitest';

import slugifyUkrainian from './slugify-ukrainian';

describe('slugifyUkrainian', () => {
  describe('Basic Transliteration (Resolution No. 55)', () => {
    it('transliterates simple consonants and vowels correctly', () => {
      // Examples from the official resolution
      expect(slugifyUkrainian('Алушта')).toBe('alushta');
      expect(slugifyUkrainian('Борщагівка')).toBe('borshchahivka');
      expect(slugifyUkrainian('Вінниця')).toBe('vinnytsia');
      expect(slugifyUkrainian('Гадяч')).toBe('hadiach');
      expect(slugifyUkrainian('Богдан')).toBe('bohdan'); // г -> h
      expect(slugifyUkrainian('Ґалаґан')).toBe('galagan'); // ґ -> g
      expect(slugifyUkrainian('Житомир')).toBe('zhytomyr');
      expect(slugifyUkrainian('Закарпаття')).toBe('zakarpattia');
    });

    it('removes soft signs (ь) completely', () => {
      expect(slugifyUkrainian('Львів')).toBe('lviv');
      expect(slugifyUkrainian('Коростень')).toBe('korosten');
    });

    it('removes apostrophes completely', () => {
      expect(slugifyUkrainian("Знам'янка")).toBe('znamianka'); // Straight apostrophe
      expect(slugifyUkrainian('Знам’янка')).toBe('znamianka'); // Curly apostrophe
    });
  });

  describe('Position-Dependent Rules (Start of word vs Inside)', () => {
    // Rules for: є, ї, й, ю, я
    // Start: ye, yi, y, yu, ya
    // Other: ie, i, i, iu, ia

    it('handles Є/є correctly', () => {
      expect(slugifyUkrainian('Єнакієве')).toBe('yenakiieve'); // Start -> ye, Inside -> ie
      expect(slugifyUkrainian('Гаєвич')).toBe('haievych'); // Inside -> ie
    });

    it('handles Ї/ї correctly', () => {
      expect(slugifyUkrainian('Їжак')).toBe('yizhak'); // Start -> yi
      expect(slugifyUkrainian('Кадіївка')).toBe('kadiivka'); // Inside -> i
      expect(slugifyUkrainian('Україна')).toBe('ukraina'); // Inside -> i
    });

    it('handles Й/й correctly', () => {
      expect(slugifyUkrainian('Йосипівка')).toBe('yosypivka'); // Start -> y
      expect(slugifyUkrainian('Стрий')).toBe('stryi'); // End/Inside -> i
      expect(slugifyUkrainian('Олексій')).toBe('oleksii'); // End -> i
    });

    it('handles Ю/ю correctly', () => {
      expect(slugifyUkrainian('Юрій')).toBe('yurii'); // Start -> yu, Inside -> i (from й)
      expect(slugifyUkrainian('Крюківка')).toBe('kriukivka'); // Inside -> iu
    });

    it('handles Я/я correctly', () => {
      expect(slugifyUkrainian('Яготин')).toBe('yahotyn'); // Start -> ya
      expect(slugifyUkrainian('Ічня')).toBe('ichnia'); // Inside -> ia
      expect(slugifyUkrainian('Марія')).toBe('mariia'); // Inside -> ia
    });

    it('detects "Start of Word" even after spaces in multi-word strings', () => {
      // "Юрій" (Start) + " " + "Яковлєв" (Start of second word)
      expect(slugifyUkrainian('Юрій Яковлєв')).toBe('yurii-yakovliev');
    });
  });

  describe('Special Ligature Exceptions', () => {
    it('transliterates "зг" as "zgh" to avoid confusion with "zh" (ж)', () => {
      expect(slugifyUkrainian('Згорани')).toBe('zghorany');
      expect(slugifyUkrainian('Розгон')).toBe('rozghon'); // inside word
    });
  });

  describe('Slug Formatting', () => {
    it('lowercases the result', () => {
      expect(slugifyUkrainian('КИЇВ')).toBe('kyiv');
    });

    it('replaces spaces with hyphens', () => {
      expect(slugifyUkrainian('Тарас Шевченко')).toBe('taras-shevchenko');
    });

    it('collapses multiple spaces into a single hyphen', () => {
      expect(slugifyUkrainian('Привіт    світ')).toBe('pryvit-svit');
    });

    it('removes special characters and punctuation', () => {
      expect(slugifyUkrainian('Привіт, світ!')).toBe('pryvit-svit');
      expect(slugifyUkrainian('Київ - це столиця.')).toBe('kyiv-tse-stolytsia');
      expect(slugifyUkrainian('Code #1')).toBe('code-1');
    });

    it('preserves latin characters and numbers', () => {
      expect(slugifyUkrainian('NextJS і React 19')).toBe('nextjs-i-react-19');
    });

    it('trims whitespace from ends', () => {
      expect(slugifyUkrainian('  Слава Україні  ')).toBe('slava-ukraini');
    });
  });

  describe('Edge Cases', () => {
    it('returns empty string for empty input', () => {
      expect(slugifyUkrainian('')).toBe('');
    });

    it('handles mixed case inputs correctly', () => {
      expect(slugifyUkrainian('ЮрІй')).toBe('yurii');
    });
  });
});
