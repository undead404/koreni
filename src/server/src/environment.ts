import dotenv from 'dotenv';
import { z } from 'zod';

import { nonEmptyString } from './schemata';

dotenv.config();

const environmentSchema = z.object({
  BUGSNAG_API_API_KEY: nonEmptyString.optional(),
  GITHUB_OAUTH_CLIENT_ID: nonEmptyString.optional(),
  GITHUB_OAUTH_CLIENT_SECRET: nonEmptyString.optional(),
  GITHUB_REPO: nonEmptyString,
  GITHUB_TOKEN: nonEmptyString,
  NEXT_PUBLIC_SITE: nonEmptyString,
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().optional().default('4000'),
  POSTHOG_KEY: nonEmptyString,
  POSTHOG_HOST: nonEmptyString,
  TURNSTILE_SECRET_KEY: nonEmptyString,
  VALID_API_KEYS: z
    .string()
    .optional()
    .default('')
    .transform(
      (string_) =>
        new Set(
          string_
            .split(',')
            .map((key) => key.trim())
            .filter(Boolean),
        ),
    ),
});

const environment = environmentSchema.parse({
  BUGSNAG_API_API_KEY: process.env.BUGSNAG_API_API_KEY,
  GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID,
  GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET,
  GITHUB_REPO: process.env.GITHUB_REPO,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  NEXT_PUBLIC_SITE: process.env.NEXT_PUBLIC_SITE,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  POSTHOG_KEY: process.env.POSTHOG_KEY,
  POSTHOG_HOST: process.env.POSTHOG_HOST,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  VALID_API_KEYS: process.env.VALID_API_KEYS,
});

export default environment;
