import { describe, expect, it } from 'vitest';

import {
  parsePartialIsoYear,
  PARTIAL_ISO_REGEX,
} from './parse-partial-iso-date';

describe('PARTIAL_ISO_REGEX', () => {
  it('matches YYYY', () => {
    expect(PARTIAL_ISO_REGEX.test('1743')).toBe(true);
  });

  it('matches YYYY-MM', () => {
    expect(PARTIAL_ISO_REGEX.test('1743-05')).toBe(true);
  });

  it('matches YYYY-MM-DD', () => {
    expect(PARTIAL_ISO_REGEX.test('1743-05-12')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(PARTIAL_ISO_REGEX.test('')).toBe(false);
  });

  it('rejects month 13', () => {
    expect(PARTIAL_ISO_REGEX.test('1743-13-01')).toBe(false);
  });

  it('rejects month 00', () => {
    expect(PARTIAL_ISO_REGEX.test('1743-00-01')).toBe(false);
  });

  it('rejects day 00', () => {
    expect(PARTIAL_ISO_REGEX.test('1743-05-00')).toBe(false);
  });

  it('rejects day 32', () => {
    expect(PARTIAL_ISO_REGEX.test('1743-05-32')).toBe(false);
  });

  it('rejects dot-separated date', () => {
    expect(PARTIAL_ISO_REGEX.test('12.05.1743')).toBe(false);
  });

  it('rejects slash-separated date', () => {
    expect(PARTIAL_ISO_REGEX.test('1743/05/12')).toBe(false);
  });

  it('rejects prose', () => {
    expect(PARTIAL_ISO_REGEX.test('травня 1743')).toBe(false);
  });

  it('rejects incomplete year (3 digits)', () => {
    expect(PARTIAL_ISO_REGEX.test('174')).toBe(false);
  });

  it('rejects single-digit month', () => {
    expect(PARTIAL_ISO_REGEX.test('1743-5')).toBe(false);
  });
});

describe('parsePartialIsoYear', () => {
  it('returns year for YYYY', () => {
    expect(parsePartialIsoYear('1743')).toBe(1743);
  });

  it('returns year for YYYY-MM', () => {
    expect(parsePartialIsoYear('1743-05')).toBe(1743);
  });

  it('returns year for YYYY-MM-DD', () => {
    expect(parsePartialIsoYear('1743-05-12')).toBe(1743);
  });

  it('returns null for empty string', () => {
    expect(parsePartialIsoYear('')).toBeNull();
  });

  it('returns null for month 13 (invalid)', () => {
    expect(parsePartialIsoYear('1743-13-01')).toBeNull();
  });

  it('returns null for month 00 (invalid)', () => {
    expect(parsePartialIsoYear('1743-00-01')).toBeNull();
  });

  it('returns null for day 00 (invalid)', () => {
    expect(parsePartialIsoYear('1743-05-00')).toBeNull();
  });

  it('returns null for day 32 (invalid)', () => {
    expect(parsePartialIsoYear('1743-05-32')).toBeNull();
  });

  it('returns null for dot-separated date', () => {
    expect(parsePartialIsoYear('12.05.1743')).toBeNull();
  });

  it('returns null for slash-separated date', () => {
    expect(parsePartialIsoYear('1743/05/12')).toBeNull();
  });

  it('returns null for prose', () => {
    expect(parsePartialIsoYear('травня 1743')).toBeNull();
  });

  it('returns null for incomplete year (3 digits)', () => {
    expect(parsePartialIsoYear('174')).toBeNull();
  });

  it('returns null for single-digit month', () => {
    expect(parsePartialIsoYear('1743-5')).toBeNull();
  });
});
