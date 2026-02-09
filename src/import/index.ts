import { appendFile, readFile } from 'node:fs/promises';

import { handleImport } from './handle-import';

try {
  const payloadPath = process.env.PAYLOAD_PATH;
  if (!payloadPath) throw new Error('PAYLOAD_PATH env var is missing');

  const rawData = await readFile(payloadPath, 'utf8');
  const jsonData = JSON.parse(rawData) as unknown;

  const result = await handleImport(jsonData);

  console.log(`🎉 Successfully processed: ${result.slugId}`);

  // Output for GitHub Actions
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    await appendFile(githubOutput, `import_id=${result.slugId}\n`);
    await appendFile(githubOutput, `import_title=${result.title}\n`);
  }
} catch (error) {
  console.error('❌ Import failed:', error);
  process.exit(1);
}
