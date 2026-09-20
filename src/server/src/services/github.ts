import { RequestError } from '@octokit/request-error';
import { Octokit } from 'octokit';
import YAML from 'yaml';

import environment from '../environment.js';
import { convertArrayToCsvBase64 } from '../helpers/convert-array-to-csv-base64.js';
import getCurrentDate from '../helpers/get-current-date.js';
import { logger } from '../logger.js';
import type { ImportPayload } from '../schemata.js';

const octokit = new Octokit({
  auth: environment.GITHUB_TOKEN,
});

async function submitToGithubImpl(data: ImportPayload) {
  logger.info('dependency.github.submission_started', {
    submissionId: data.id,
  });
  const [owner, repo] = environment.GITHUB_REPO.split('/', 2);
  const branchName = `submission/${data.id}`;
  const yamlPath = `data/records/${data.id}.yaml`;
  const csvPath = `data/csv/${data.id}.csv`;
  const size = data.table.data.length;

  const metadata = {
    archiveItems: data.archiveItems,
    authorName: data.authorName,
    authorEmail: data.authorEmail,
    date: getCurrentDate(),
    id: data.id,
    location: data.location,
    size,
    sources: data.sources,
    tableFilePath: csvPath,
    tableLocale: data.tableLocale,
    title: data.title,
    yearsRange: data.yearsRange,
  };

  // 1. Preemptive Conflict Checks
  try {
    await octokit.rest.git.getRef({ owner, repo, ref: `heads/${branchName}` });
    throw new Error(`Branch ${branchName} already exists.`);
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
      // do nothing
    } else throw error;
  }

  try {
    await octokit.rest.repos.getContent({ owner, repo, path: yamlPath });
    throw new Error(`Record ${data.id} already exists in the main branch.`);
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
      // do nothing
    } else throw error;
  }

  // 2. Fetch Base Branch Data
  const { data: baseReference } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: 'heads/main', // or your default branch
  });
  const baseCommitSha = baseReference.object.sha;

  const { data: baseCommit } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: baseCommitSha,
  });
  const baseTreeSha = baseCommit.tree.sha;

  // 3. Create Blobs
  const csvBase64 = await convertArrayToCsvBase64(
    data.table.columns,
    data.table.data,
  );
  const [yamlBlob, csvBlob] = await Promise.all([
    octokit.rest.git.createBlob({
      owner,
      repo,
      content: YAML.stringify(metadata),
      encoding: 'utf8',
    }),
    octokit.rest.git.createBlob({
      owner,
      repo,
      content: csvBase64,
      encoding: 'base64',
    }),
  ]);

  // 4. Create New Tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: [
      { path: yamlPath, mode: '100644', type: 'blob', sha: yamlBlob.data.sha },
      { path: csvPath, mode: '100644', type: 'blob', sha: csvBlob.data.sha },
    ],
  });

  // 5. Create Commit & Branch Ref
  const { data: newCommit } = await octokit.rest.git.createCommit({
    author: {
      name: data.authorGithubUsername || data.authorName,
      email: data.authorEmail,
    },
    owner,
    repo,
    message: `Add record submission ${data.id}`,
    tree: newTree.sha,
    parents: [baseCommitSha],
  });

  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: newCommit.sha,
  });

  // 6. Open Pull Request
  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    title: `New Submission: ${data.id}`,
    head: branchName,
    base: 'main',
    body: `Automated PR for record submission **${data.id}**. \n- Source locale: \`${data.tableLocale}\`\n- Validated rows: ${metadata.size}\n\nAuthor: ${data.authorName}${data.authorGithubUsername ? ` (@${data.authorGithubUsername})` : ''}`,
  });

  logger.info('dependency.github.submission_completed', {
    submissionId: data.id,
    pullRequestNumber: pr.number,
  });
  return pr;
}

export default async function submitToGithub(data: ImportPayload) {
  try {
    return await submitToGithubImpl(data);
  } catch (error) {
    logger.error('dependency.github.submission_failed', {
      submissionId: data.id,
      error,
    });
    throw error;
  }
}
