import { Octokit } from '@octokit/rest';

import type { IndexationTable } from '../../../shared/schemas/indexation-table';
import environment from '../environment';

const octokit = new Octokit({ auth: environment.GITHUB_TOKEN });

const OWNER = environment.GITHUB_OWNER;
const REPO = environment.GITHUB_REPO;
const BASE_BRANCH = 'main';

interface FilePayload {
  path: string;
  content: string;
  mode: '100644' | '100755' | '040000' | '160000' | '120000';
  type: 'blob' | 'tree' | 'commit';
}

export default async function submitToGithub(
  files: FilePayload[],
  meta: IndexationTable,
) {
  const branchName = `import/${meta.id}`;

  // 1. Get the SHA of the base branch
  const { data: referenceData } = await octokit.git.getRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${BASE_BRANCH}`,
  });
  const baseSha = referenceData.object.sha;

  // 2. Create Blobs (File contents)
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const { data: blob } = await octokit.git.createBlob({
        owner: OWNER,
        repo: REPO,
        content: file.content,
        encoding: 'utf8',
      });
      return {
        path: file.path,
        mode: file.mode,
        type: file.type,
        sha: blob.sha,
      };
    }),
  );

  // 3. Create Tree (Snapshot of directory structure)
  const { data: tree } = await octokit.git.createTree({
    owner: OWNER,
    repo: REPO,
    base_tree: baseSha,
    tree: treeItems,
  });

  // 4. Create Commit
  const { data: commit } = await octokit.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message: `feat(data): import ${meta.title} (${meta.id})`,
    tree: tree.sha,
    parents: [baseSha],
    author: {
      name: 'API Import Bot',
      email: 'bot@example.com',
      date: new Date().toISOString(),
    },
  });

  // 5. Create Branch Reference
  await octokit.git.createRef({
    owner: OWNER,
    repo: REPO,
    ref: `refs/heads/${branchName}`,
    sha: commit.sha,
  });

  const prBody = `Title: ${meta.title}\n\nAuthor: ${meta.author}\n\nDate: ${meta.date.toString()}\n\nId: ${meta.id}\n\nLocation: ${meta.location.join(
    ', ',
  )}\n\nSources: ${meta.sources.join(', ')}\n\nTableLocale: ${meta.tableLocale}\n\nTitle: ${meta.title}\n\nYearsRange: ${meta.yearsRange.join(
    ', ',
  )}\n\nArchiveItems: ${meta.archiveItems?.join(', ')}\n\n`;

  // 6. Create Pull Request
  const { data: pr } = await octokit.pulls.create({
    labels: ['automated-import'],
    owner: OWNER,
    repo: REPO,
    title: `Import: ${meta.title}`,
    head: branchName,
    base: BASE_BRANCH,
    body: prBody,
  });

  return { prNumber: pr.number, htmlUrl: pr.html_url };
}
