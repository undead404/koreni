import { beforeEach, describe, expect, it, vi } from 'vitest';

import dispatchGithubWorkflow from './github-workflow-dispatch.js';

const mocks = vi.hoisted(() => ({
  createWorkflowDispatch: vi.fn(),
  loggerError:
    vi.fn<(event: string, fields?: Record<string, unknown>) => void>(),
  reportError: vi.fn(),
}));

vi.mock('octokit', () => ({
  Octokit: class MockOctokit {
    public readonly rest = {
      actions: { createWorkflowDispatch: mocks.createWorkflowDispatch },
    };
  },
}));
vi.mock('../environment.js', () => ({
  default: {
    GITHUB_REPO: 'koreni-owner/koreni-repo',
    GITHUB_TOKEN: 'server-token',
  },
}));
vi.mock('./bugsnag.js', () => ({ reportError: mocks.reportError }));
vi.mock('../logger.js', () => ({ logger: { error: mocks.loggerError } }));

describe('dispatchGithubWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createWorkflowDispatch.mockResolvedValue({});
  });

  it('dispatches the main workflow on main without event inputs', async () => {
    await dispatchGithubWorkflow();

    expect(mocks.createWorkflowDispatch).toHaveBeenCalledWith({
      owner: 'koreni-owner',
      repo: 'koreni-repo',
      ref: 'main',
      workflow_id: 'main.yml',
    });
  });

  it('logs validated GitHub diagnostics and reports/rethrows only a generic error', async () => {
    mocks.createWorkflowDispatch.mockRejectedValueOnce({
      message: 'Request failed',
      response: {
        data: { message: 'Resource not accessible', private: 'must not log' },
        headers: { 'X-GitHub-Request-Id': 'ABC123' },
        status: 403,
      },
      status: 500,
    });

    await expect(dispatchGithubWorkflow()).rejects.toThrow(
      'GitHub workflow dispatch failed',
    );
    expect(mocks.loggerError).toHaveBeenCalledWith(
      'dependency.github.workflow_dispatch_failed',
      {
        github_request_id: 'ABC123',
        github_status: 403,
        reason: 'Resource not accessible',
      },
    );
    expect(mocks.reportError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'GitHub workflow dispatch failed' }),
    );
    expect(JSON.stringify(mocks.loggerError.mock.calls)).not.toContain(
      'must not log',
    );
  });

  it('redacts secrets, emails, and control characters and caps the logged reason', async () => {
    mocks.createWorkflowDispatch.mockRejectedValueOnce(
      new Error(`Bearer server-token private@example.org\n${'x'.repeat(600)}`),
    );

    let thrownError: unknown;
    try {
      await dispatchGithubWorkflow();
    } catch (error: unknown) {
      thrownError = error;
    }

    const loggedReason = mocks.loggerError.mock.calls[0]?.[1]?.reason;
    expect(typeof loggedReason).toBe('string');
    if (typeof loggedReason !== 'string')
      throw new Error('Expected a sanitized dispatch failure reason');
    expect(loggedReason).toHaveLength(500);
    // eslint-disable-next-line no-control-regex
    expect(loggedReason).not.toMatch(/[\u{0}-\u{1F}\u{7F}-\u{9F}]/u);
    expect(loggedReason).not.toContain('server-token');
    expect(loggedReason).not.toContain('private@example.org');
    expect(JSON.stringify(mocks.loggerError.mock.calls)).not.toContain(
      'server-token',
    );
    expect(JSON.stringify(mocks.loggerError.mock.calls)).not.toContain(
      'private@example.org',
    );
    expect(mocks.reportError).toHaveBeenCalledWith(thrownError);
    expect(thrownError).toBeInstanceOf(Error);
    if (!(thrownError instanceof Error))
      throw new Error('Expected a generic Error to be rethrown');
    expect(thrownError.message).toBe('GitHub workflow dispatch failed');
    expect(thrownError.message).not.toContain('server-token');
    expect(thrownError.message).not.toContain('private@example.org');
  });

  it('logs a safe transport reason without inventing GitHub metadata', async () => {
    mocks.createWorkflowDispatch.mockRejectedValueOnce(
      new Error('Temporary network failure'),
    );

    await expect(dispatchGithubWorkflow()).rejects.toThrow(
      'GitHub workflow dispatch failed',
    );

    expect(mocks.loggerError).toHaveBeenCalledWith(
      'dependency.github.workflow_dispatch_failed',
      { reason: 'Temporary network failure' },
    );
  });

  it('falls back to a valid top-level status without discarding the provider reason', async () => {
    mocks.createWorkflowDispatch.mockRejectedValueOnce({
      message: 'Fallback exception reason',
      response: {
        data: { message: 'Provider reason' },
        headers: { 'x-github-request-id': 'x'.repeat(129) },
        status: 700,
      },
      status: 429,
    });

    await expect(dispatchGithubWorkflow()).rejects.toThrow(
      'GitHub workflow dispatch failed',
    );

    expect(mocks.loggerError).toHaveBeenCalledWith(
      'dependency.github.workflow_dispatch_failed',
      { github_status: 429, reason: 'Provider reason' },
    );
  });

  it.each([
    ['a non-Error rejection', 'not an Error'],
    ['a malformed response body', { response: { data: 'not an object' } }],
  ])('uses a fixed reason for %s', async (_label, rejection: unknown) => {
    mocks.createWorkflowDispatch.mockRejectedValueOnce(rejection);

    await expect(dispatchGithubWorkflow()).rejects.toThrow(
      'GitHub workflow dispatch failed',
    );

    expect(mocks.loggerError).toHaveBeenCalledWith(
      'dependency.github.workflow_dispatch_failed',
      { reason: 'Unknown GitHub workflow dispatch error' },
    );
    expect(mocks.reportError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'GitHub workflow dispatch failed' }),
    );
  });
});
