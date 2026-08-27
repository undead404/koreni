import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { generateKarmaStats } from './generate-karma-stats.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  const directories = [...temporaryDirectories];
  temporaryDirectories.length = 0;
  await Promise.all(
    directories.map((directory) => rm(directory, { recursive: true })),
  );
});

describe('generateKarmaStats', () => {
  it('generates deterministic aggregate statistics from local data', async () => {
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'koreni-karma-'));
    const root = path.join(projectRoot, 'data');
    temporaryDirectories.push(projectRoot);
    await mkdir(path.join(root, 'records'), { recursive: true });
    await mkdir(path.join(root, 'csv'));
    await writeFile(
      path.join(root, 'records', 'one.yaml'),
      'authorEmail: USER@example.com\ntableFilePath: data/csv/one.csv\ntitle: One\n',
    );
    await writeFile(
      path.join(root, 'csv', 'one.csv'),
      'name,number\nAlice,1\nAlice,2\n',
    );
    const outputPath = path.join(root, 'generated', 'karma-stats.json');

    await generateKarmaStats(root, outputPath, 'revision');

    const index = JSON.parse(await readFile(outputPath, 'utf8')) as {
      revision: string;
      users: Record<
        string,
        { contribution: number; rowCount: number; tableCount: number }
      >;
    };
    expect(index.revision).toBe('revision');
    expect(index.users['user@example.com']).toStrictEqual({
      contribution: 7,
      rowCount: 2,
      tableCount: 1,
    });
  });

  it('excludes records without an email', async () => {
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'koreni-karma-'));
    const root = path.join(projectRoot, 'data');
    temporaryDirectories.push(projectRoot);
    await mkdir(path.join(root, 'records'), { recursive: true });
    await mkdir(path.join(root, 'csv'));
    await writeFile(
      path.join(root, 'records', 'one.yaml'),
      'tableFilePath: data/csv/one.csv\ntitle: One\n',
    );
    const outputPath = path.join(root, 'karma-stats.json');

    await generateKarmaStats(root, outputPath, 'revision');

    const index = JSON.parse(await readFile(outputPath, 'utf8')) as {
      users: Record<string, unknown>;
    };
    expect(index.users).toStrictEqual({});
  });
});
