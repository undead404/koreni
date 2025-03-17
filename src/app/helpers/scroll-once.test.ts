import { describe, expect, it, vi } from 'vitest';

import scrollOnce from './scroll-once';

function createDiv() {
  const element = document.createElement('div');
  element.scrollIntoView = vi.fn();
  return element;
}

describe('scrollOnce', () => {
  it('should do nothing if the element is null', () => {
    const element = null;
    expect(() => scrollOnce(element)).not.toThrow();
  });

  it('should do nothing if the element has already been scrolled', () => {
    const element = createDiv();
    element.dataset['hasScrolled'] = 'true';

    scrollOnce(element);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(element.scrollIntoView).not.toHaveBeenCalled();
  });

  it('should scroll the element into view if it has not been scrolled before', () => {
    const element = createDiv();

    scrollOnce(element);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(element.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(element.dataset['hasScrolled']).toBe('true');
  });

  it('should not scroll the element again if it has already been scrolled once', () => {
    const element = createDiv();

    scrollOnce(element);
    scrollOnce(element);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(element.scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
