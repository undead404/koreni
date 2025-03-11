import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import Header from './header';

describe('Header component', () => {
  afterEach(() => {
    cleanup();
  });
  it('should render the header element', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('should render the tables link with correct text and href', () => {
    const { getByText } = render(<Header />);
    const tablesLink = getByText('Таблиці');
    expect(tablesLink).toBeInTheDocument();
    expect(tablesLink).toHaveAttribute('href', '/tables');
  });

  it('should render the map link with correct text and href', () => {
    const { getByText } = render(<Header />);
    const mapLink = getByText('Мапа');
    expect(mapLink).toBeInTheDocument();
    expect(mapLink).toHaveAttribute('href', '/map');
  });

  it('should have the correct class names for the header and links', () => {
    const { container, getByText } = render(<Header />);
    const header = container.querySelector('header');
    const tablesLink = getByText('Таблиці');
    const mapLink = getByText('Мапа');

    expect(header).toHaveClass('header');
    expect(tablesLink).toHaveClass('link');
    expect(mapLink).toHaveClass('link');
  });
});
