import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

import type { AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { DATA_DIR, TYPESENSE_PORT } from './config';
import { typesenseHealthcheckResponseSchema } from './schemata';
import startTypesense from './start-typesense';
import waitUntil from './wait-until';

vi.mock('node:child_process', () => {
  const mock = {
    execSync: vi.fn(),
  };
  return {
    __esModule: true,
    default: mock,
    ...mock,
  };
});

vi.mock('node:fs', () => {
  const mock = { existsSync: vi.fn(), mkdirSync: vi.fn() };
  return {
    __esModule: true,
    default: mock,
    ...mock,
  };
});

vi.mock('./wait-until');

describe('startTypesense', () => {
  const mockClient = {
    get: vi.fn(),
  } as unknown as AxiosInstance;

  const bootstrapKey = 'test-bootstrap-key';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create data directory if it does not exist', async () => {
    (existsSync as Mock).mockReturnValue(false);

    await startTypesense(mockClient, bootstrapKey);

    expect(existsSync).toHaveBeenCalledWith(DATA_DIR);
    expect(mkdirSync).toHaveBeenCalledWith(DATA_DIR);
  });

  it('should not create data directory if it already exists', async () => {
    (existsSync as Mock).mockReturnValue(true);

    await startTypesense(mockClient, bootstrapKey);

    expect(existsSync).toHaveBeenCalledWith(DATA_DIR);
    expect(mkdirSync).not.toHaveBeenCalled();
  });

  it('should run Typesense in Docker', async () => {
    (existsSync as Mock).mockReturnValue(true);

    await startTypesense(mockClient, bootstrapKey);

    expect(execSync).toHaveBeenCalledWith(
      `docker run -d --name typesense-server -p ${TYPESENSE_PORT}:8108 -v ${DATA_DIR}:/data typesense/typesense:28.0 --api-key=${bootstrapKey} --data-dir=/data`,
      { stdio: 'inherit' },
    );
  });

  it('should wait until Typesense is ready', async () => {
    (existsSync as Mock).mockReturnValue(true);
    (waitUntil as Mock).mockImplementation(async (checkFunction) => {
      await checkFunction();
    });

    const healthcheckResponse = { ok: true };
    (mockClient.get as Mock).mockResolvedValueOnce({
      data: healthcheckResponse,
    });
    vi.spyOn(typesenseHealthcheckResponseSchema, 'parse').mockReturnValue(
      healthcheckResponse,
    );

    await startTypesense(mockClient, bootstrapKey);

    expect(waitUntil).toHaveBeenCalled();
    expect(mockClient.get).toHaveBeenCalledWith('/health');
    expect(typesenseHealthcheckResponseSchema.parse).toHaveBeenCalledWith(
      healthcheckResponse,
    );
  });

  it('should log "Please wait..." if Typesense is not ready', async () => {
    (existsSync as Mock).mockReturnValue(true);
    (waitUntil as Mock).mockImplementation(async (checkFunction: () => any) => {
      await checkFunction();
    });

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    (mockClient.get as Mock).mockRejectedValueOnce(new Error('Please wait...'));

    await startTypesense(mockClient, bootstrapKey);

    expect(consoleLogSpy).toHaveBeenCalledWith('Please wait...');

    consoleLogSpy.mockRestore();
  });
});
