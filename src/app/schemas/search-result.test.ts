import { describe, expect, it } from 'vitest';

import resultSchema from './search-result';

describe('resultSchema', () => {
  it('should validate a correct result object', () => {
    const validResult = {
      document: {
        id: '1',
        tableId: 'valid-id',
        title: 'Valid Title',
      },
      highlight: {
        data: {
          field1: {
            snippet: 'Sample snippet',
            matched_tokens: ['Sample'],
          },
        },
      },
      text_match_info: {
        best_field_score: '2',
      },
    };

    expect(() => resultSchema.parse(validResult)).not.toThrow();
  });

  it('should invalidate a result object with missing required fields', () => {
    const invalidResult = {
      document: {
        id: '',
        tableId: 'valid-id',
        title: '',
      },
      highlight: {
        data: {
          field1: {
            snippet: 'Sample snippet',
            matched_tokens: ['Sample'],
          },
        },
      },
      text_match_info: {
        best_field_score: '2',
      },
    };

    expect(() => resultSchema.parse(invalidResult)).toThrow();
  });

  it('should invalidate a result object with incorrect types', () => {
    const invalidResult = {
      document: {
        id: 1, // should be a string
        tableId: 1, // should be a string
        title: 123, // should be a string
      },
      highlight: {
        data: {
          field1: {
            snippet: 'Sample snippet',
            matched_tokens: ['Sample'],
          },
        },
      },
      text_match_info: {
        best_field_score: '2',
      },
    };

    expect(() => resultSchema.parse(invalidResult)).toThrow();
  });

  it('should validate a result object without highlight data', () => {
    const validResult = {
      document: {
        id: '1',
        tableId: 'valid-id',
        title: 'Valid Title',
      },
      highlight: {},
      text_match_info: {
        best_field_score: '2',
      },
    };

    expect(() => resultSchema.parse(validResult)).not.toThrow();
  });

  it('should invalidate a result object with invalid highlight data', () => {
    const invalidResult = {
      document: {
        id: '1',
        tableId: 'valid-id',
        title: 'Valid Title',
      },
      highlight: {
        data: {
          field1: {
            snippet: 123, // should be a string
            matched_tokens: 'Sample', // should be an array of strings
          },
        },
      },
      text_match_info: {
        best_field_score: '2',
      },
    };

    expect(() => resultSchema.parse(invalidResult)).toThrow();
  });
});
