import { describe, expect, it } from 'vitest';

import {
  importPayloadSchema,
  karmaLinkedUserSchema,
  karmaLinkedUsersResponseSchema,
  navigatorErrorResponseSchema,
  navigatorIngestPayloadSchema,
  navigatorIngestResponseSchema,
  navigatorLinkRedeemPayloadSchema,
  navigatorLinkRedeemResponseSchema,
  navigatorLookupPayloadSchema,
  navigatorLookupResponseSchema,
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

  describe('karmaLinkedUserSchema & karmaLinkedUsersResponseSchema', () => {
    it('should accept valid linked user object and list response', () => {
      const validUser = {
        contribution_email: null,
        email: 'user@example.com',
        karma_linked_at: '2026-08-22T10:00:00.000Z',
      };
      expect(karmaLinkedUserSchema.safeParse(validUser).success).toBe(true);
      expect(
        karmaLinkedUsersResponseSchema.safeParse({ users: [validUser] })
          .success,
      ).toBe(true);
    });

    it('should accept linked users from servers that do not expose contribution email yet', () => {
      const legacyUser = {
        email: 'user@example.com',
        karma_linked_at: '2026-08-22T10:00:00.000Z',
      };

      expect(karmaLinkedUserSchema.safeParse(legacyUser).success).toBe(true);
    });

    it('should reject invalid email in linked user', () => {
      const invalidUser = {
        email: 'not-an-email',
        karma_linked_at: '2026-08-22T10:00:00.000Z',
      };
      expect(karmaLinkedUserSchema.safeParse(invalidUser).success).toBe(false);
      expect(
        karmaLinkedUsersResponseSchema.safeParse({ users: [invalidUser] })
          .success,
      ).toBe(false);
    });
  });

  describe('navigatorLinkRedeemPayloadSchema', () => {
    it('should accept valid payload with or without total', () => {
      expect(
        navigatorLinkRedeemPayloadSchema.safeParse({
          code: 'AB12CD34EF',
          login: 'user@example.com',
          total: 100,
        }).success,
      ).toBe(true);

      expect(
        navigatorLinkRedeemPayloadSchema.safeParse({
          code: 'AB12CD34EF',
          login: 'user@example.com',
        }).success,
      ).toBe(true);
    });

    it('should reject empty code, invalid login email, or negative total', () => {
      expect(
        navigatorLinkRedeemPayloadSchema.safeParse({
          code: '',
          login: 'user@example.com',
        }).success,
      ).toBe(false);

      expect(
        navigatorLinkRedeemPayloadSchema.safeParse({
          code: 'CODE',
          login: 'not-email',
        }).success,
      ).toBe(false);

      expect(
        navigatorLinkRedeemPayloadSchema.safeParse({
          code: 'CODE',
          login: 'user@example.com',
          total: -5,
        }).success,
      ).toBe(false);

      expect(
        navigatorLinkRedeemPayloadSchema.safeParse({
          code: 'CODE',
          login: 'user@example.com',
          total: 12.34,
        }).success,
      ).toBe(false);
    });
  });

  describe('navigatorLinkRedeemResponseSchema', () => {
    it('should accept valid redeem response', () => {
      expect(
        navigatorLinkRedeemResponseSchema.safeParse({
          ok: true,
          awarded: 50,
        }).success,
      ).toBe(true);
    });

    it('should reject non-true ok or negative/non-int awarded', () => {
      expect(
        navigatorLinkRedeemResponseSchema.safeParse({
          ok: false,
          awarded: 50,
        }).success,
      ).toBe(false);

      expect(
        navigatorLinkRedeemResponseSchema.safeParse({
          ok: true,
          awarded: -1,
        }).success,
      ).toBe(false);

      expect(
        navigatorLinkRedeemResponseSchema.safeParse({
          ok: true,
          awarded: 1.5,
        }).success,
      ).toBe(false);
    });
  });

  describe('navigatorIngestPayloadSchema', () => {
    it('should accept valid ingest payload', () => {
      expect(
        navigatorIngestPayloadSchema.safeParse({
          accounts: [
            { login: 'ivan@example.com', total: 130 },
            { login: 'olena@example.com', total: 0 },
          ],
        }).success,
      ).toBe(true);
    });

    it('should reject accounts with invalid email or negative/non-int total', () => {
      expect(
        navigatorIngestPayloadSchema.safeParse({
          accounts: [{ login: 'invalid-email', total: 100 }],
        }).success,
      ).toBe(false);

      expect(
        navigatorIngestPayloadSchema.safeParse({
          accounts: [{ login: 'valid@example.com', total: -10 }],
        }).success,
      ).toBe(false);
    });
  });

  describe('navigatorIngestResponseSchema', () => {
    it('should accept valid ingest response', () => {
      expect(
        navigatorIngestResponseSchema.safeParse({
          synced: 2,
          awarded: 30,
          unknown: ['olena@example.com'],
        }).success,
      ).toBe(true);
    });

    it('should reject invalid synced or awarded', () => {
      expect(
        navigatorIngestResponseSchema.safeParse({
          synced: -1,
          awarded: 10,
          unknown: [],
        }).success,
      ).toBe(false);
    });
  });

  describe('navigatorErrorResponseSchema', () => {
    it('should accept documented error response objects', () => {
      expect(
        navigatorErrorResponseSchema.safeParse({
          error: 'invalid_or_expired',
        }).success,
      ).toBe(true);

      expect(
        navigatorErrorResponseSchema.safeParse({
          error: 'already_linked',
        }).success,
      ).toBe(true);
    });
  });

  describe('navigatorLookupPayloadSchema', () => {
    it('should accept valid lookup payload', () => {
      expect(
        navigatorLookupPayloadSchema.safeParse({
          service: 'inventarium',
          users: ['user1@example.com', 'user2@example.com'],
        }).success,
      ).toBe(true);
    });

    it('should reject empty service', () => {
      expect(
        navigatorLookupPayloadSchema.safeParse({
          service: '',
          users: ['user1@example.com'],
        }).success,
      ).toBe(false);
    });
  });

  describe('navigatorLookupResponseSchema', () => {
    it('should accept valid lookup response', () => {
      expect(
        navigatorLookupResponseSchema.safeParse({
          service: 'inventarium',
          name: 'Інвентаріум',
          results: [
            {
              user: 'user1@example.com',
              found: true,
              serviceKarma: 100,
              totalKarma: 500,
            },
          ],
        }).success,
      ).toBe(true);
    });
  });
});
