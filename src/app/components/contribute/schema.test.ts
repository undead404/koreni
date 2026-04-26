import { describe, expect, it } from 'vitest';

import {
  authorIdentitySchema,
  contributeFormSchema,
  coordinatesStringAsTupleSchema,
} from './schema';

describe('contributeFormSchema', () => {
  const validData = {
    archiveItems: [{ item: 'Item 1' }],
    authorEmail: 'test@example.com',
    authorGithubUsername: 'test-user',
    authorName: 'John Doe',
    id: 'valid-id-123',
    location: '50.4501,30.5234',
    sources: [{ url: 'https://example.com' }],
    table: null, // FileList is skipped on server/test environment
    tableLocale: 'uk',
    title: 'Valid Title',
    yearsRange: [1900, 1910],
  };

  it('should validate correct data', () => {
    const result = contributeFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail if archiveItems is empty', () => {
    const result = contributeFormSchema.safeParse({
      ...validData,
      archiveItems: [],
    });
    expect(result.success).toBe(false);
  });

  it('should fail if id contains invalid characters', () => {
    const result = contributeFormSchema.safeParse({
      ...validData,
      id: 'invalid_id!',
    });
    expect(result.success).toBe(false);
  });

  it('should fail if location is not valid coordinates', () => {
    const result = contributeFormSchema.safeParse({
      ...validData,
      location: 'invalid,location',
    });
    expect(result.success).toBe(false);
  });

  it('should fail if yearsRange contains year before 1500', () => {
    const result = contributeFormSchema.safeParse({
      ...validData,
      yearsRange: [1499],
    });
    expect(result.success).toBe(false);
  });

  it('should fail if tableLocale is empty', () => {
    const result = contributeFormSchema.safeParse({
      ...validData,
      tableLocale: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('authorIdentitySchema', () => {
  it('should validate correct data', () => {
    const result = authorIdentitySchema.safeParse({
      authorName: 'John Doe',
      authorEmail: 'john@example.com',
      authorGithubUsername: 'johndoe',
    });
    expect(result.success).toBe(true);
  });

  it('should validate with only authorName', () => {
    const result = authorIdentitySchema.safeParse({
      authorName: 'John Doe',
    });
    expect(result.success).toBe(true);
  });

  it('should fail without authorName', () => {
    const result = authorIdentitySchema.safeParse({
      authorEmail: 'john@example.com',
    });
    expect(result.success).toBe(false);
  });
});

describe('coordinatesStringAsTupleSchema', () => {
  it('should parse valid coordinates string to tuple', () => {
    const result = coordinatesStringAsTupleSchema.safeParse('50.4501,30.5234');
    expect(result).toEqual({
      success: true,
      data: [50.4501, 30.5234],
    });
  });

  it('should parse negative coordinates', () => {
    const result = coordinatesStringAsTupleSchema.safeParse('-50.4501,-30.5234');
    expect(result).toEqual({
      success: true,
      data: [-50.4501, -30.5234],
    });
  });

  it('should fail on invalid format', () => {
    const result = coordinatesStringAsTupleSchema.safeParse('50.4501;30.5234');
    expect(result.success).toBe(false);
  });

  it('should fail on non-numeric values', () => {
    const result = coordinatesStringAsTupleSchema.safeParse('lat,lng');
    expect(result.success).toBe(false);
  });
});
