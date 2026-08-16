import { describe, expect,it } from 'vitest';

import { BENEFACTORS } from './benefactors.js';

describe('BENEFACTORS constant', () => {
  it('is a non-empty array', () => {
    expect(BENEFACTORS.length).toBeGreaterThanOrEqual(1);
  });

  it('has at most one entry with isFirst: true', () => {
    const firstCount = BENEFACTORS.filter((b) => b.isFirst).length;
    expect(firstCount).toBeLessThanOrEqual(1);
  });

  it('every entry has a non-empty name', () => {
    for (const b of BENEFACTORS) {
      expect(b.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('every entry has a valid primaryUrl starting with https://', () => {
    for (const b of BENEFACTORS) {
      expect(b.primaryUrl).toMatch(/^https:\/\//);
    }
  });

  it('every entry with a secondaryUrl also has a secondaryLabel', () => {
    for (const b of BENEFACTORS) {
      const hasSecondaryUrl = b.secondaryUrl !== undefined;
      const secondaryLabel = b.secondaryLabel?.trim() ?? '';
      expect(hasSecondaryUrl).toBe(secondaryLabel.length > 0);
    }
  });

  it('Serhii Fazulianov entry has correct shape', () => {
    const serhii = BENEFACTORS.find((b) => b.name === 'Сергій Фазульянов');
    expect(serhii).toBeDefined();
    expect(serhii).toStrictEqual({
      name: 'Сергій Фазульянов',
      descriptor: 'генеалог',
      primaryUrl: 'https://www.facebook.com/S.Fazulyanov',
      secondaryUrl: 'https://www.instagram.com/fazu.genealogy/',
      secondaryLabel: 'Instagram',
      isFirst: true,
    });
  });
});
