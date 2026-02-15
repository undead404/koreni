import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const nonEmptyString = z.string().min(1);

const environmentSchema = z.object({
  NEXT_PUBLIC_BUGSNAG_API_KEY: z.string().optional(),
  NEXT_PUBLIC_GISCUS_REPO_ID: nonEmptyString,
  NEXT_PUBLIC_GISCUS_CATEGORY_ID: nonEmptyString,
  NEXT_PUBLIC_GITHUB_REPO: nonEmptyString,
  NEXT_PUBLIC_POSTHOG_KEY: nonEmptyString,
  NEXT_PUBLIC_POSTHOG_HOST: nonEmptyString,
  NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: nonEmptyString,
  NEXT_PUBLIC_TYPESENSE_HOST: nonEmptyString,
  NEXT_PUBLIC_SITE: nonEmptyString,
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

const environment = environmentSchema.parse({
  NEXT_PUBLIC_BUGSNAG_API_KEY: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
  NEXT_PUBLIC_GISCUS_REPO_ID: process.env.NEXT_PUBLIC_GISCUS_REPO_ID,
  NEXT_PUBLIC_GISCUS_CATEGORY_ID: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
  NEXT_PUBLIC_GITHUB_REPO: process.env.NEXT_PUBLIC_GITHUB_REPO,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_TYPESENSE_SEARCH_KEY:
    process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY,
  NEXT_PUBLIC_TYPESENSE_HOST: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
  NEXT_PUBLIC_SITE: process.env.NEXT_PUBLIC_SITE,
  NODE_ENV: process.env.NODE_ENV,
});

export default environment;
