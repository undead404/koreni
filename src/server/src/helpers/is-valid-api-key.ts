import environment from '../environment.js';

const isValidApiKey = (apiKey: string | undefined): boolean => {
  if (!apiKey) return false;
  return environment.VALID_API_KEYS.has(apiKey);
};

export default isValidApiKey;
