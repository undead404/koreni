import { RequestError } from '@octokit/request-error';
import { Octokit } from 'octokit';
import YAML from 'yaml';

import environment from '../environment.js';
import calculateCsvLinesSize from '../helpers/calculate-csv-lines-size.js';
import getCurrentDate from '../helpers/get-current-date.js';
import { ImportPayload } from '../schemata.js';

const octokit = new Octokit({
  auth: environment.GITHUB_TOKEN,
});

export default async function submitToGithub(data: ImportPayload) {
  const [owner, repo] = environment.GITHUB_REPO.split('/');
  const branchName = `submission/${data.id}`;
  const yamlPath = `data/records/${data.id}.yaml`;
  const csvPath = `public/csv/${data.id}.csv`;
  const size = await calculateCsvLinesSize(data.table);

  const metadata = {
    archiveItems: data.archiveItems,
    authorName: data.authorName,
    authorEmail: data.authorEmail,
    date: getCurrentDate(),
    id: data.id,
    location: data.location,
    size,
    sources: data.sources,
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
  const csvBuffer = Buffer.from(await data.table.arrayBuffer());

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
      content: csvBuffer.toString('base64'),
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

  return pr;
}
