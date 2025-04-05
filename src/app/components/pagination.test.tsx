import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import Pagination from './pagination';

const defaultProps = {
  currentPage: 1,
  totalPages: 5,
  urlBuilder: (page: number) => `/page/${page}`,
};

describe('Pagination component', () => {
  // Cleanup after each test
  afterEach(() => {
    cleanup();
  });

  it('should render the nav element', () => {
    const { container } = render(<Pagination {...defaultProps} />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('should render the correct number of page links', () => {
    const { container } = render(<Pagination {...defaultProps} />);
    const pageLinks = container.querySelectorAll('li');
    expect(pageLinks.length).toBe(defaultProps.totalPages);
  });

  it('should render the current page as a span element', () => {
    const { getByText } = render(<Pagination {...defaultProps} />);
    const currentPage = getByText(`${defaultProps.currentPage}`);
    expect(currentPage.tagName).toBe('SPAN');
    expect(currentPage).toHaveClass('currentPage');
  });

  it('should render other pages as anchor elements with correct href', () => {
    const { container } = render(<Pagination {...defaultProps} />);
    const links = container.querySelectorAll('a');
    for (const [index, link] of links.entries()) {
      // +2 because the first page is current, rendered as a span
      expect(link).toHaveAttribute('href', `/page/${index + 2}`);
    }
  });

  it('should apply the correct classes to the elements', () => {
    const { container, getByText } = render(<Pagination {...defaultProps} />);
    const nav = container.querySelector('nav');
    const ul = container.querySelector('ul');
    const currentPage = getByText(`${defaultProps.currentPage}`);
    const link = container.querySelector('a');

    expect(nav).toHaveClass('nav');
    expect(ul).toHaveClass('ul');
    expect(currentPage).toHaveClass('currentPage');
    expect(link).toHaveClass('link');
  });
});
