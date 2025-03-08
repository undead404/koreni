import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import getSearchParameters from './get-search-parameters';

describe('getSearchParameters', () => {
  let originalLocation: Location;

  beforeEach(() => {
    // Save the original globalThis.location
    originalLocation = globalThis.location;
  });

  afterEach(() => {
    // Restore the original globalThis.location
    globalThis.location = originalLocation;
    vi.clearAllMocks();
  });

  it('should return URLSearchParams instance with search parameters', () => {
    // Mock globalThis.location
    globalThis.location = {
      search: '?param1=value1&param2=value2',
    } as Location;

    const searchParameters = getSearchParameters();

    expect(searchParameters.get('param1')).toBe('value1');
    expect(searchParameters.get('param2')).toBe('value2');
  });

  it('should return empty URLSearchParams instance when search is empty', () => {
    // Mock globalThis.location with empty search
    globalThis.location = {
      search: '',
    } as Location;

    const searchParameters = getSearchParameters();

    expect(searchParameters.toString()).toBe('');
  });

  it('should return empty URLSearchParams instance when globalThis.location is undefined', () => {
    // Mock globalThis.location as undefined
    globalThis.location = undefined as any;

    const searchParameters = getSearchParameters();

    expect(searchParameters.toString()).toBe('');
  });
});
