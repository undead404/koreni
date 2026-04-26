import { describe, expect, it } from 'vitest';

import formatBytes from './format-bytes';

describe('formatBytes', () => {
  it('formats bytes correctly for values under 1024', () => {
    expect(formatBytes(0)).toBe('0 Б');
    expect(formatBytes(500)).toBe('500 Б');
    expect(formatBytes(1023)).toBe('1023 Б');
  });

  it('formats kilobytes correctly for values between 1024 and 1048575', () => {
    expect(formatBytes(1024)).toBe('1.0 КіБ');
    expect(formatBytes(1536)).toBe('1.5 КіБ');
    expect(formatBytes(1048575)).toBe('1024.0 КіБ');
  });

  it('formats megabytes correctly for values 1048576 and above', () => {
    expect(formatBytes(1048576)).toBe('1.0 МіБ');
    expect(formatBytes(1572864)).toBe('1.5 МіБ');
    expect(formatBytes(1048576 * 5.25)).toBe('5.3 МіБ');
  });
});
