import { render } from '@testing-library/react';
import posthog from 'posthog-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="posthog-provider">{children}</div>
  ),
}));

vi.mock('@/app/environment', () => ({
  default: {
    NEXT_PUBLIC_POSTHOG_KEY: 'test_key',
    NEXT_PUBLIC_POSTHOG_HOST: 'https://test.posthog.com',
    NODE_ENV: 'test',
  },
}));

describe('PostHogProvider', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should initialize posthog with correct config when keys are present', async () => {
    const { PostHogProvider } = await import('./posthog');
    render(
      <PostHogProvider>
        <div>Content</div>
      </PostHogProvider>,
    );

    expect(posthog.init).toHaveBeenCalledTimes(1);
    expect(posthog.init).toHaveBeenCalledWith(
      'test_key',
      expect.objectContaining({
        api_host: 'https://test.posthog.com',
        autocapture: false,
        capture_exceptions: true,
        debug: false,
        ip: false,
        opt_out_capturing_by_default: true,
        persistence: 'sessionStorage',
      }),
    );
  });

  it('should verify loaded callback behavior in production', async () => {
    const { PostHogProvider } = await import('./posthog');
    render(
      <PostHogProvider>
        <div>Content</div>
      </PostHogProvider>,
    );

    const initCall = vi.mocked(posthog.init).mock.calls[0];

    const config = initCall[1];

    // Simulate loaded callback
    const mockPostHogInstance = { debug: vi.fn() };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    config?.loaded?.(mockPostHogInstance as any);

    expect(mockPostHogInstance.debug).not.toHaveBeenCalled();
  });

  it('should render children', async () => {
    const { PostHogProvider } = await import('./posthog');
    const { getByText } = render(
      <PostHogProvider>
        <div>Test Content</div>
      </PostHogProvider>,
    );

    expect(getByText('Test Content')).toBeDefined();
  });
});

describe('PostHogProvider (Development)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    vi.doMock('@/app/environment', () => ({
      default: {
        NEXT_PUBLIC_POSTHOG_KEY: 'dev_key',
        NEXT_PUBLIC_POSTHOG_HOST: 'https://dev.posthog.com',
        NODE_ENV: 'development',
      },
    }));
  });

  it('should enable debug in development mode', async () => {
    // Re-import to get fresh mock
    const { PostHogProvider: DevelopmentProvider } = await import('./posthog');

    render(
      <DevelopmentProvider>
        <div>Content</div>
      </DevelopmentProvider>,
    );

    expect(posthog.init).toHaveBeenCalledWith(
      'dev_key',
      expect.objectContaining({
        debug: true,
      }),
    );

    const initCall = vi.mocked(posthog.init).mock.calls[0];

    const config = initCall[1];

    // Simulate loaded callback
    const mockPostHogInstance = { debug: vi.fn() };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    config?.loaded?.(mockPostHogInstance as any);

    expect(mockPostHogInstance.debug).toHaveBeenCalled();
  });
});

describe('PostHogProvider (Missing Config)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    vi.doMock('@/app/environment', () => ({
      default: {
        NEXT_PUBLIC_POSTHOG_KEY: '',
        NEXT_PUBLIC_POSTHOG_HOST: '',
      },
    }));
  });

  it('should not initialize posthog if keys are missing', async () => {
    const { PostHogProvider: EmptyProvider } = await import('./posthog');

    render(
      <EmptyProvider>
        <div>Content</div>
      </EmptyProvider>,
    );

    expect(posthog.init).not.toHaveBeenCalled();
  });
});
