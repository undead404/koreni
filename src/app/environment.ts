// Define a small helper that takes the already-extracted value
const validateEnvironment = (
  key: string,
  value: string | undefined,
  required: boolean,
): string => {
  if (required && (!value || value.trim() === '')) {
    throw new Error(`Environment variable ${key} is missing or empty`);
  }
  return value || '';
};

const isProduction = process.env.NODE_ENV === 'production';

const environment = {
  NEXT_PUBLIC_BUGSNAG_API_KEY: validateEnvironment(
    'NEXT_PUBLIC_BUGSNAG_API_KEY',
    process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
    isProduction,
  ),
  NEXT_PUBLIC_GISCUS_REPO_ID: validateEnvironment(
    'NEXT_PUBLIC_GISCUS_REPO_ID',
    process.env.NEXT_PUBLIC_GISCUS_REPO_ID,
    isProduction,
  ),
  NEXT_PUBLIC_GISCUS_CATEGORY_ID: validateEnvironment(
    'NEXT_PUBLIC_GISCUS_CATEGORY_ID',
    process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
    isProduction,
  ),
  NEXT_PUBLIC_GITHUB_REPO: validateEnvironment(
    'NEXT_PUBLIC_GITHUB_REPO',
    process.env.NEXT_PUBLIC_GITHUB_REPO,
    true,
  ),
  NEXT_PUBLIC_POSTHOG_KEY: validateEnvironment(
    'NEXT_PUBLIC_POSTHOG_KEY',
    process.env.NEXT_PUBLIC_POSTHOG_KEY,
    isProduction,
  ),
  NEXT_PUBLIC_POSTHOG_HOST: validateEnvironment(
    'NEXT_PUBLIC_POSTHOG_HOST',
    process.env.NEXT_PUBLIC_POSTHOG_HOST,
    isProduction,
  ),
  NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: validateEnvironment(
    'NEXT_PUBLIC_TYPESENSE_SEARCH_KEY',
    process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY,
    isProduction,
  ),
  NEXT_PUBLIC_TYPESENSE_HOST: validateEnvironment(
    'NEXT_PUBLIC_TYPESENSE_HOST',
    process.env.NEXT_PUBLIC_TYPESENSE_HOST,
    isProduction,
  ),
  NEXT_PUBLIC_SITE: validateEnvironment(
    'NEXT_PUBLIC_SITE',
    process.env.NEXT_PUBLIC_SITE,
    true,
  ),
  NODE_ENV: process.env.NODE_ENV || ('development' as const),
} as const;

export default environment;
