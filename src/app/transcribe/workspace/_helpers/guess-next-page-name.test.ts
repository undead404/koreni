import { describe, expect, it } from 'vitest';

import type { ProjectImage } from '../../schemata';

import { guessNextPageName } from './guess-next-page-name';

const createImage = (id: string, pageName: string | null): ProjectImage => ({
  id,
  projectId: 'p1',
  storageKey: `key-${id}`,
  url: `url-${id}`,
  pageSequence: 0,
  pageName,
});

describe('guessNextPageName', () => {
  it('returns null if currentIndex < 2', () => {
    const images = [createImage('1', '1'), createImage('2', '2')];
    expect(guessNextPageName(0, images)).toBeNull();
    expect(guessNextPageName(1, images)).toBeNull();
  });

  it('returns null if there are untitled pages before currentIndex', () => {
    const images = [
      createImage('1', '1'),
      createImage('2', null),
      createImage('3', null),
    ];
    expect(guessNextPageName(2, images)).toBeNull();
  });

  it('Case 1: prev2: "N", prev1: "M", N + 1 = M -> guess "(M + 1)"', () => {
    const images = [
      createImage('1', '10'),
      createImage('2', '11'),
      createImage('3', null),
    ];
    expect(guessNextPageName(2, images)).toBe('12');
  });

  it('Case 2: prev2: "Nзв", prev1: "M", N + 1 = M -> guess "Mзв"', () => {
    const images = [
      createImage('1', '10зв'),
      createImage('2', '11'),
      createImage('3', null),
    ];
    expect(guessNextPageName(2, images)).toBe('11зв');
  });

  it('Case 3: prev2: "N", prev1: "Nзв" -> guess "(N + 1)"', () => {
    const images = [
      createImage('1', '10'),
      createImage('2', '10зв'),
      createImage('3', null),
    ];
    expect(guessNextPageName(2, images)).toBe('11');
  });

  it('Case 4: prev2: "N", prev1: "Nа" -> guess "(N + 1)"', () => {
    const images = [
      createImage('1', '10'),
      createImage('2', '10а'),
      createImage('3', null),
    ];
    expect(guessNextPageName(2, images)).toBe('11');
  });

  it('Case 5: prev2: "Na" (Latin), prev1: "M", where N + 1 = M -> guess "(M + 1)"', () => {
    const images = [
      createImage('1', '10a'),
      createImage('2', '11'),
      createImage('3', null),
    ];
    expect(guessNextPageName(2, images)).toBe('12');
  });

  it('Case 6: prev2: "Nзв", prev1: "Nа" -> guess "Nазв"', () => {
    const images = [
      createImage('1', '10зв'),
      createImage('2', '10а'),
      createImage('3', null),
    ];
    expect(guessNextPageName(2, images)).toBe('10азв');
  });

  it('Case 7: prev2: "Nа", prev1: "Naзв" -> guess "(N + 1)"', () => {
    const images = [
      createImage('1', '10а'),
      createImage('2', '10азв'),
      createImage('3', null),
    ];
    expect(guessNextPageName(2, images)).toBe('11');
  });
});
