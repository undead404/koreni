import axios from 'axios';
import * as dotenv from 'dotenv';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { TYPESENSE_PORT } from './config';
import createCollections from './create-collections';
import getTypesenseAdminKey from './get-typesense-admin-key';
import getTypesenseBootstrapKey from './get-typesense-bootstrap-key';
import getTypesenseSearchKey from './get-typesense-search-key';
import main from './main';
import prepareDotenvBlank from './prepare-dotenv-blank';
import startTypesense from './start-typesense';
import stopTypesense from './stop-typesense';

vi.mock('axios');
vi.mock('dotenv');
vi.mock('lodash');
vi.mock('./create-collections');
vi.mock('./get-typesense-admin-key');
vi.mock('./get-typesense-bootstrap-key');
vi.mock('./get-typesense-search-key');
vi.mock('./prepare-dotenv-blank');
vi.mock('./start-typesense');
vi.mock('./stop-typesense');

describe('main', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should execute the main process without errors', async () => {
    const mockClient = {
      post: vi.fn(),
    };

    (axios.create as Mock).mockReturnValue(mockClient);
    (getTypesenseBootstrapKey as Mock).mockReturnValue([
      'test-bootstrap-key',
      true,
    ]);
    (getTypesenseAdminKey as Mock).mockResolvedValue('test-admin-key');
    (getTypesenseSearchKey as Mock).mockResolvedValue('test-search-key');

    await main();

    expect(prepareDotenvBlank).toHaveBeenCalled();
    expect(dotenv.config).toHaveBeenCalled();
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: `http://localhost:${TYPESENSE_PORT}`,
    });
    expect(startTypesense).toHaveBeenCalledWith(
      mockClient,
      'test-bootstrap-key',
    );
    expect(getTypesenseAdminKey).toHaveBeenCalledWith(
      mockClient,
      'test-bootstrap-key',
      true,
    );
    expect(createCollections).toHaveBeenCalledWith(
      mockClient,
      'test-admin-key',
    );
    expect(getTypesenseSearchKey).toHaveBeenCalledWith(
      mockClient,
      'test-admin-key',
      true,
    );
  });

  it('should handle errors and stop Typesense', async () => {
    const error = new Error('Test error');
    (getTypesenseBootstrapKey as Mock).mockImplementation(() => {
      throw error;
    });

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    expect(consoleLogSpy).toHaveBeenCalledWith('[object Undefined]');
    expect(stopTypesense).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
