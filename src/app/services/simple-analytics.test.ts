/* eslint-disable unicorn/prefer-global-this */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import trackEvent from './simple-analytics';

describe('trackEvent', () => {
  const eventName = 'testEvent';
  const metadata = { key1: 'value1', key2: 'value2' };

  beforeEach(() => {
    // Mock window.sa_event
    global.window = Object.create(window);
    global.window.sa_event = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete global.window.sa_event;
  });

  it('should call sa_event with the correct arguments if sa_event exists', () => {
    trackEvent(eventName, metadata);

    expect(window.sa_event).toHaveBeenCalledWith(eventName, metadata);
  });

  it('should not throw an error if sa_event does not exist', () => {
    delete global.window.sa_event;

    expect(() => trackEvent(eventName, metadata)).not.toThrow();
  });
});
