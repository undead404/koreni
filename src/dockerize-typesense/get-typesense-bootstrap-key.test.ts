import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest';

import generateKey from './generate-key';
import getTypesenseBootstrapKey from './get-typesense-bootstrap-key';
import writeEnvironmentValues from './write-environment-values';

vi.mock('./generate-key');
vi.mock('./write-environment-values');

describe('getTypesenseBootstrapKey', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnvironment };
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = originalEnvironment;
  });

  it('should return existing bootstrap key if it exists and is not "xyz"', () => {
    const existingBootstrapKey = 'existing-key';
    process.env.TYPESENSE_BOOTSTRAP_KEY = existingBootstrapKey;

    const [bootstrapKey, isNew] = getTypesenseBootstrapKey();

    expect(bootstrapKey).toBe(existingBootstrapKey);
    expect(isNew).toBe(false);
    expect(generateKey).not.toHaveBeenCalled();
    expect(writeEnvironmentValues).not.toHaveBeenCalled();
  });

  it('should generate a new bootstrap key if none exists or it is "xyz"', () => {
    const newBootstrapKey = 'new-generated-key';
    (generateKey as Mock).mockReturnValue(newBootstrapKey);
    process.env.TYPESENSE_BOOTSTRAP_KEY = 'xyz';

    const [bootstrapKey, isNew] = getTypesenseBootstrapKey();

    expect(bootstrapKey).toBe(newBootstrapKey);
    expect(isNew).toBe(true);
    expect(generateKey).toHaveBeenCalled();
    expect(writeEnvironmentValues).toHaveBeenCalledWith({
      TYPESENSE_BOOTSTRAP_KEY: newBootstrapKey,
    });
  });

  it('should generate a new bootstrap key if no key exists', () => {
    const newBootstrapKey = 'new-generated-key';
    (generateKey as Mock).mockReturnValue(newBootstrapKey);
    delete process.env.TYPESENSE_BOOTSTRAP_KEY;

    const [bootstrapKey, isNew] = getTypesenseBootstrapKey();

    expect(bootstrapKey).toBe(newBootstrapKey);
    expect(isNew).toBe(true);
    expect(generateKey).toHaveBeenCalled();
    expect(writeEnvironmentValues).toHaveBeenCalledWith({
      TYPESENSE_BOOTSTRAP_KEY: newBootstrapKey,
    });
  });
});
