import environment from '../environment.js';
import { githubReadinessReferenceSchema } from '../schemata.js';

import { reportError } from './bugsnag.js';

const CACHE_TTL_MS = 30_000;
const TIMEOUT_MS = 5000;

let cached: { ready: boolean; expiresAt: number } | undefined;
let pending: Promise<boolean> | undefined;

async function isGithubReady(): Promise<boolean> {
  try {
    const parts = environment.GITHUB_REPO.split('/');
    const [owner, repo] = parts;
    if (!owner || !repo || parts.length !== 2) {
      throw new Error('Invalid GitHub repository configuration');
    }

    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/main`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${environment.GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        redirect: 'error',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!response.ok) {
      throw new Error('GitHub readiness request failed');
    }
    const body: unknown = await response.json();
    githubReadinessReferenceSchema.parse(body);
    return true;
  } catch {
    // Never forward fetch errors, headers, or provider bodies containing secrets.
    reportError(new Error('GitHub import readiness check failed'));
    return false;
  }
}

export function checkGithubReadiness(): Promise<boolean> {
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.ready);
  }
  if (pending) return pending;

  pending = isGithubReadyAndRefreshCache();
  return pending;
}

async function isGithubReadyAndRefreshCache(): Promise<boolean> {
  try {
    const isReady = await isGithubReady();
    cached = { ready: isReady, expiresAt: Date.now() + CACHE_TTL_MS };
    return isReady;
  } finally {
    pending = undefined;
  }
}
