import { describe, expect, it } from 'vitest';

import { importPayloadSchema } from './import';

describe('importPayloadSchema', () => {
  it('should be defined', () => {
    expect(importPayloadSchema).toBeDefined();
  });

  it('should fail validation if table is missing', () => {
    const invalidPayload = {
      authorGithubUsername: 'testuser',
      turnstileToken: 'token123',
      // missing 'table' and base indexationTableSchema fields
    };

    const result = importPayloadSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should fail validation if table columns are invalid', () => {
    const invalidPayload = {
      table: {
        columns: 'not-an-array',
        data: [],
      },
    };

    const result = importPayloadSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should fail validation if table data is invalid', () => {
    const invalidPayload = {
      table: {
        columns: ['col1'],
        data: ['not-a-record'],
      },
    };

    const result = importPayloadSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });
});
