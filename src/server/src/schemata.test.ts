import { describe, expect, it } from 'vitest';

import {
  importPayloadSchema,
  nonEmptyString,
  turnstilePayloadSchema,
  turnstileResponseSchema,
} from './schemata.js';

describe('schemata', () => {
  describe('nonEmptyString', () => {
    it('should accept a non-empty string', () => {
      expect(nonEmptyString.safeParse('hello').success).toBe(true);
    });

    it('should reject an empty string', () => {
      expect(nonEmptyString.safeParse('').success).toBe(false);
    });
  });

  describe('importPayloadSchema', () => {
    const validPayload = {
      archiveItems: ['item1'],
      authorName: 'John Doe',
      authorEmail: 'john@example.com',
      id: 'valid-id-123',
      location: [50.45, 30.52],
      sources: ['source1'],
      table: {
        columns: ['col1'],
        data: [{ col1: 'val1' }],
      },
      tableLocale: 'uk',
      title: 'Valid Title',
      yearsRange: [1900, 1910],
    };

    it('should accept a valid payload', () => {
      expect(importPayloadSchema.safeParse(validPayload).success).toBe(true);
    });

    it('should reject invalid id format', () => {
      const invalidPayload = { ...validPayload, id: 'invalid_id!' };
      expect(importPayloadSchema.safeParse(invalidPayload).success).toBe(false);
    });

    it('should reject invalid location coordinates', () => {
      const invalidPayload = { ...validPayload, location: [100, 200] };
      expect(importPayloadSchema.safeParse(invalidPayload).success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidPayload = { ...validPayload };
      // @ts-expect-error Testing invalid payload
      delete invalidPayload.authorName;
      expect(importPayloadSchema.safeParse(invalidPayload).success).toBe(false);
    });
  });

  describe('turnstilePayloadSchema', () => {
    it('should accept with token', () => {
      expect(
        turnstilePayloadSchema.safeParse({ turnstileToken: 'token' }).success,
      ).toBe(true);
    });

    it('should accept without token', () => {
      expect(turnstilePayloadSchema.safeParse({}).success).toBe(true);
    });
  });

  describe('turnstileResponseSchema', () => {
    it('should accept valid success response', () => {
      expect(turnstileResponseSchema.safeParse({ success: true }).success).toBe(
        true,
      );
    });

    it('should accept valid error response', () => {
      expect(
        turnstileResponseSchema.safeParse({
          success: false,
          'error-codes': ['invalid-input-response'],
        }).success,
      ).toBe(true);
    });
  });
});
