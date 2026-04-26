import posthog from 'posthog-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { initBugsnag } from '@/app/services/bugsnag';

import { restoreAuthorIdentity, saveAuthorIdentity } from './local-storage';
import { authorIdentitySchema } from './schema';

// Mock dependencies
vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

vi.mock('@/app/services/bugsnag', () => ({
  initBugsnag: vi.fn(() => ({
    notify: vi.fn(),
  })),
}));

vi.mock('./schema', () => ({
  authorIdentitySchema: {
    parse: vi.fn(),
  },
}));

describe('local-storage', () => {
  let mockNotify: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockNotify = vi.fn();
    vi.mocked(initBugsnag).mockReturnValue({ notify: mockNotify } as any);
  });

  describe('restoreAuthorIdentity', () => {
    it('returns null if no saved state exists', () => {
      expect(restoreAuthorIdentity()).toBeNull();
    });

    it('returns parsed identity if valid data exists', () => {
      const mockData = { name: 'John Doe', email: 'john@example.com' };
      localStorage.setItem(
        'contribute_author_identity',
        JSON.stringify(mockData),
      );
      vi.mocked(authorIdentitySchema.parse).mockReturnValue(mockData as any);

      const result = restoreAuthorIdentity();

      expect(result).toEqual(mockData);
      expect(authorIdentitySchema.parse).toHaveBeenCalledWith(mockData);
    });

    it('handles JSON parse errors gracefully', () => {
      localStorage.setItem('contribute_author_identity', 'invalid-json');

      const result = restoreAuthorIdentity();

      expect(result).toBeNull();
      expect(posthog.capture).toHaveBeenCalledWith(
        'author_identity_restore_failed',
        expect.any(Object),
      );
      expect(mockNotify).toHaveBeenCalled();
      expect(localStorage.getItem('contribute_author_identity')).toBeNull();
    });

    it('handles schema validation errors gracefully', () => {
      const mockData = { invalid: 'data' };
      localStorage.setItem(
        'contribute_author_identity',
        JSON.stringify(mockData),
      );
      
      const error = new Error('Validation failed');
      vi.mocked(authorIdentitySchema.parse).mockImplementation(() => {
        throw error;
      });

      const result = restoreAuthorIdentity();

      expect(result).toBeNull();
      expect(posthog.capture).toHaveBeenCalledWith(
        'author_identity_restore_failed',
        { error: 'Validation failed' },
      );
      expect(mockNotify).toHaveBeenCalledWith(error);
      expect(localStorage.getItem('contribute_author_identity')).toBeNull();
    });
  });

  describe('saveAuthorIdentity', () => {
    it('saves serialized data to localStorage', () => {
      const mockData = { name: 'Jane Doe', email: 'jane@example.com' };
      
      saveAuthorIdentity(mockData);

      const saved = localStorage.getItem('contribute_author_identity');
      expect(saved).toBe(JSON.stringify(mockData));
    });

    it('handles serialization errors gracefully', () => {
      // Create a circular reference to force JSON.stringify to throw
      const circularData: any = {};
      circularData.self = circularData;

      saveAuthorIdentity(circularData);

      expect(posthog.capture).toHaveBeenCalledWith(
        'author_identity_save_failed',
        expect.any(Object),
      );
      expect(mockNotify).toHaveBeenCalled();
    });
  });
});
