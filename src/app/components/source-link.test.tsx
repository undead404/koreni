import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SourceLink from './source-link';

describe('SourceLink', () => {
  it('should render a link with the correct host name for a known site', () => {
    const { getByText } = render(
      <SourceLink href="https://docs.google.com/document/d/1" />,
    );
    const linkElement = getByText('Google Docs');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute(
      'href',
      'https://docs.google.com/document/d/1',
    );
    expect(linkElement).toHaveAttribute('target', '_blank');
  });

  it('should render a link with the host name for an unknown site', () => {
    const { getByText } = render(
      <SourceLink href="https://unknownsite.com/page" />,
    );
    const linkElement = getByText('unknownsite.com');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', 'https://unknownsite.com/page');
    expect(linkElement).toHaveAttribute('target', '_blank');
  });

  it('should render the href as text if the URL is invalid', () => {
    const { getByText } = render(<SourceLink href="invalid-url" />);
    const textElement = getByText('invalid-url');
    expect(textElement).toBeInTheDocument();
  });

  it('should log an error to the console if the URL is invalid', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    render(<SourceLink href="invalid-url" />);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
