import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import sleep from './sleep';
import waitUntil from './wait-until';

vi.mock('./sleep');

describe('waitUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should resolve if predicate returns true immediately', async () => {
    const predicate = vi.fn().mockResolvedValue(true);

    await expect(waitUntil(predicate)).resolves.toBeUndefined();
    expect(predicate).toHaveBeenCalledTimes(1);
  });

  it('should keep calling predicate until it returns true', async () => {
    const predicate = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const promise = waitUntil(predicate);

    vi.advanceTimersByTime(3000);

    await expect(promise).resolves.toBeUndefined();
    expect(predicate).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledWith(1000);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('should reject with timeout error if predicate does not return true within timeout', async () => {
    const predicate = vi.fn().mockResolvedValue(false);

    const promise = waitUntil(predicate, 5000);

    vi.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow('Timeout');
    expect(predicate).toHaveBeenCalled();
    expect(sleep).toHaveBeenCalledWith(1000);
  });
});
