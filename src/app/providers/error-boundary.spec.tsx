import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// We need to mock the module BEFORE importing the component under test
// because the component is determined at module evaluation time.
const mockIsStarted = vi.fn();
const mockGetPlugin = vi.fn();
const mockCreateErrorBoundary = vi.fn();

vi.mock('../services/bugsnag', () => ({
  initBugsnag: () => ({
    isStarted: mockIsStarted,
    getPlugin: mockGetPlugin,
  }),
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should use Stub component when Bugsnag is not started', async () => {
    mockIsStarted.mockReturnValue(false);

    // Dynamic import to ensure fresh module evaluation
    const { default: ErrorBoundary } = await import('./error-boundary');

    const { container } = render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>,
    );

    expect(container.textContent).toBe('Content');
    expect(mockGetPlugin).not.toHaveBeenCalled();
  });

  it('should use Stub component when Bugsnag is started but react plugin is missing', async () => {
    mockIsStarted.mockReturnValue(true);
    // eslint-disable-next-line unicorn/no-useless-undefined
    mockGetPlugin.mockReturnValue(undefined);

    const { default: ErrorBoundary } = await import('./error-boundary');

    const { container } = render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>,
    );

    expect(container.textContent).toBe('Content');
    expect(mockGetPlugin).toHaveBeenCalledWith('react');
  });

  it('should use Bugsnag ErrorBoundary when initialized correctly', async () => {
    mockIsStarted.mockReturnValue(true);

    const MockBugsnagBoundary = ({
      children,
    }: {
      children: React.ReactNode;
    }) => <div data-testid="bugsnag-boundary">{children}</div>;
    mockCreateErrorBoundary.mockReturnValue(MockBugsnagBoundary);

    mockGetPlugin.mockReturnValue({
      createErrorBoundary: mockCreateErrorBoundary,
    });

    const { default: ErrorBoundary } = await import('./error-boundary');

    const { getByTestId } = render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>,
    );

    expect(getByTestId('bugsnag-boundary')).toBeDefined();
    expect(getByTestId('bugsnag-boundary').textContent).toBe('Content');
    expect(mockCreateErrorBoundary).toHaveBeenCalledWith(React);
  });
});
