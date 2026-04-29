import { cleanup, render } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Remark42 from './remark42';

const noop = () => {};

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

describe('Remark42', () => {
  const host = 'https://comments.example.com';
  const siteId = 'test-site';

  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/test-path');

    // Mock matchMedia
    Object.defineProperty(globalThis, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
      writable: true,
    });

    // Clean up globals
    delete globalThis.REMARK42;
    delete globalThis.remark_config;

    // Clean up scripts
    document.head.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders a div with id remark42', () => {
    const { container } = render(<Remark42 host={host} siteId={siteId} />);
    const div = container.querySelector('#remark42');
    expect(div).toBeInTheDocument();
  });

  it('sets global remark_config on mount', () => {
    render(<Remark42 host={host} siteId={siteId} />);
    expect(globalThis.remark_config).toBeDefined();
    expect(globalThis.remark_config?.host).toBe(host);
    expect(globalThis.remark_config?.site_id).toBe(siteId);
    expect(globalThis.remark_config?.url).toContain('/test-path');
  });

  it('appends script tag if REMARK42 is not present', () => {
    render(<Remark42 host={host} siteId={siteId} />);
    const script = document.head.querySelector('script');
    expect(script).toBeInTheDocument();
    expect(script?.src).toBe(`${host}/web/embed.js`);
  });

  it('calls createInstance if REMARK42 is already present', () => {
    const mockCreateInstance = vi.fn();
    globalThis.REMARK42 = {
      changeTheme: vi.fn(),
      createInstance: mockCreateInstance,
      destroy: vi.fn(),
    };

    render(<Remark42 host={host} siteId={siteId} />);

    expect(mockCreateInstance).toHaveBeenCalled();
  });

  it('calls destroy on unmount', () => {
    const mockDestroy = vi.fn();
    globalThis.REMARK42 = {
      changeTheme: vi.fn(),
      createInstance: vi.fn(),
      destroy: mockDestroy,
    };

    const { unmount } = render(<Remark42 host={host} siteId={siteId} />);
    unmount();

    expect(mockDestroy).toHaveBeenCalled();
  });

  it('re-initializes on pathname change', () => {
    const mockCreateInstance = vi.fn();
    const mockDestroy = vi.fn();
    globalThis.REMARK42 = {
      changeTheme: vi.fn(),
      createInstance: mockCreateInstance,
      destroy: mockDestroy,
    };

    const { rerender } = render(<Remark42 host={host} siteId={siteId} />);
    expect(mockCreateInstance).toHaveBeenCalledTimes(1);

    vi.mocked(usePathname).mockReturnValue('/new-path');
    rerender(<Remark42 host={host} siteId={siteId} />);

    expect(mockDestroy).toHaveBeenCalled();
    expect(mockCreateInstance).toHaveBeenCalledTimes(2);
    expect(mockCreateInstance.mock.calls[1][0].url).toContain('/new-path');
  });

  it('does not append multiple script tags on navigation', () => {
    const { rerender } = render(<Remark42 host={host} siteId={siteId} />);
    expect(document.head.querySelectorAll('script').length).toBe(1);

    vi.mocked(usePathname).mockReturnValue('/new-path');
    rerender(<Remark42 host={host} siteId={siteId} />);

    expect(document.head.querySelectorAll('script').length).toBe(1);
  });

  it('updates theme when prefers-color-scheme changes', () => {
    const changeTheme = vi.fn();
    globalThis.REMARK42 = {
      changeTheme,
      createInstance: vi.fn(),
      destroy: vi.fn(),
    };

    let changeHandler: (event: { matches: boolean }) => void = noop;

    vi.mocked(globalThis.matchMedia).mockImplementation((query: string) => ({
      addEventListener: vi.fn().mockImplementation((_, handler) => {
        changeHandler = handler;
      }),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    render(<Remark42 host={host} siteId={siteId} />);

    // Simulate theme change to dark
    changeHandler({ matches: true });
    expect(changeTheme).toHaveBeenCalledWith('dark');

    // Simulate theme change to light
    changeHandler({ matches: false });
    expect(changeTheme).toHaveBeenCalledWith('light');
  });
});
