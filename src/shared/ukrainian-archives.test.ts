import { describe, expect, it } from 'vitest';

import UKRAINIAN_ARCHIVES from './ukrainian-archives';

describe('UKRAINIAN_ARCHIVES', () => {
  it('should read and parse the archives list correctly, filtering out empty lines', () => {
    expect(Array.isArray(UKRAINIAN_ARCHIVES)).toBe(true);
    expect(UKRAINIAN_ARCHIVES.length).toBeGreaterThan(0);
    
    // Check for a known archive to ensure it loaded correctly
    expect(UKRAINIAN_ARCHIVES).toContain('ЦДІАК');
    
    // Ensure no empty strings are in the array (filtering worked)
    expect(UKRAINIAN_ARCHIVES.every((archive) => archive.trim().length > 0)).toBe(true);
  });
});
