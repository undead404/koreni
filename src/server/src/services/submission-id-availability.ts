import environment from '../environment.js';
import {
  submissionRecordSchema,
  submissionReferenceSchema,
} from '../schemata.js';

import { reportError } from './bugsnag.js';

type Existence = 'exists' | 'missing' | 'unavailable';

export async function checkSubmissionIdAvailability(
  id: string,
): Promise<boolean | null> {
  const parts = environment.GITHUB_REPO.split('/');
  const [owner, repo] = parts;
  if (
    !owner ||
    !repo ||
    parts.length !== 2 ||
    !/^[\w.-]+$/.test(owner) ||
    !/^[\w.-]+$/.test(repo)
  ) {
    reportError(
      new Error('Invalid GitHub availability repository configuration'),
    );
    return null;
  }

  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const signal = AbortSignal.timeout(5000);
  const reference = `refs/heads/submission/${id}`;
  const path = `data/records/${id}.yaml`;

  async function read(
    url: string,
    kind: 'reference' | 'record',
  ): Promise<Existence> {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${environment.GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        redirect: 'error',
        signal,
      });
      if (response.status === 404) return 'missing';
      if (!response.ok) throw new Error('GitHub availability request failed');
      const body: unknown = await response.json();
      if (kind === 'reference') {
        if (submissionReferenceSchema.parse(body).ref !== reference)
          throw new Error('Unexpected reference');
      } else if (submissionRecordSchema.parse(body).path !== path) {
        throw new Error('Unexpected record');
      }
      return 'exists';
    } catch {
      reportError(new Error('GitHub submission ID availability check failed'));
      return 'unavailable';
    }
  }

  const results = await Promise.all([
    read(
      `${base}/git/ref/heads/submission/${encodeURIComponent(id)}`,
      'reference',
    ),
    read(
      `${base}/contents/data/records/${encodeURIComponent(id)}.yaml?ref=main`,
      'record',
    ),
  ]);
  if (results.includes('exists')) return false;
  return results.every((result) => result === 'missing') ? true : null;
}
