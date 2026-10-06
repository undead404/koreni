import { beforeEach, describe, expect, it, vi } from 'vitest';

import dispatchGithubWorkflow from './github-workflow-dispatch.js';

const mocks = vi.hoisted(() => ({
  createWorkflowDispatch: vi.fn(),
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
vi.mock('../logger.js', () => ({ logger: { error: vi.fn() } }));

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

  it('sanitizes and propagates GitHub dispatch errors', async () => {
    mocks.createWorkflowDispatch.mockRejectedValueOnce(
      new Error('secret-token private@example.org'),
    );

    await expect(dispatchGithubWorkflow()).rejects.toThrow(
      'GitHub workflow dispatch failed',
    );
    expect(mocks.reportError).toHaveBeenCalledWith(
      new Error('GitHub workflow dispatch failed'),
    );
    expect(JSON.stringify(mocks.reportError.mock.calls)).not.toContain(
      'private@example.org',
    );
    expect(JSON.stringify(mocks.reportError.mock.calls)).not.toContain(
      'secret-token',
    );
  });
});
