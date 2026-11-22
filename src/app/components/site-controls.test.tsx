import { cleanup, render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SiteControls from './site-controls';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

afterEach(cleanup);

describe('SiteControls', () => {
  it.each(['/not-welcome', '/not-welcome/'])(
    'does not mount interactive children on %s',
    (pathname) => {
      vi.mocked(usePathname).mockReturnValue(pathname);
      const child = vi.fn(() => <button>Menu</button>);
      const Child = child;
      const { container } = render(
        <SiteControls>
          <Child />
        </SiteControls>,
      );

      expect(container).toBeEmptyDOMElement();
      expect(child).not.toHaveBeenCalled();
    },
  );

  it('restores controls when navigating away from the blocked page', () => {
    vi.mocked(usePathname).mockReturnValue('/not-welcome');
    const { rerender } = render(
      <SiteControls>
        <button>Menu</button>
      </SiteControls>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    vi.mocked(usePathname).mockReturnValue('/');
    rerender(
      <SiteControls>
        <button>Menu</button>
      </SiteControls>,
    );
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });
});
