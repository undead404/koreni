import { Octokit } from 'octokit';

import environment from '../environment.js';
import { logger } from '../logger.js';

import { reportError } from './bugsnag.js';

const octokit = new Octokit({ auth: environment.GITHUB_TOKEN });

export default async function dispatchGithubWorkflow(): Promise<void> {
  try {
    const [owner, repo] = environment.GITHUB_REPO.split('/', 2);
    if (!owner || !repo)
      throw new Error('Invalid GitHub repository configuration');
    await octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      ref: 'main',
      workflow_id: 'main.yml',
    });
  } catch {
    logger.error('dependency.github.workflow_dispatch_failed');
    reportError(new Error('GitHub workflow dispatch failed'));
    throw new Error('GitHub workflow dispatch failed');
  }
}
