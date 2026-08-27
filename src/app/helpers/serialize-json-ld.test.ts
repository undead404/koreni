import { describe, expect, it } from 'vitest';

import serializeJsonLd from './serialize-json-ld';

describe('serializeJsonLd', () => {
  it('escapes HTML opening brackets', () => {
    const serialized = serializeJsonLd({ description: '</script>' });

    expect(serialized).toBe(String.raw`{"description":"\u003c/script>"}`);
    expect(JSON.parse(serialized)).toEqual({ description: '</script>' });
  });
});
