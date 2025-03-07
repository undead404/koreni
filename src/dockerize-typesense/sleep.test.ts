import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import sleep from './sleep';

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve after the specified timeout', async () => {
    const timeout = 1000;
    const promise = sleep(timeout);

    vi.advanceTimersByTime(timeout);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should resolve after the default timeout if no timeout is specified', async () => {
    const defaultTimeout = 500;
    const promise = sleep();

    vi.advanceTimersByTime(defaultTimeout);

    await expect(promise).resolves.toBeUndefined();
  });
});
