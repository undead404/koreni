import dotenv from 'dotenv';
import { z } from 'zod';

import { nonEmptyString } from './schemata.js';

dotenv.config();

const environmentSchema = z.object({
  BUGSNAG_API_API_KEY: nonEmptyString.optional(),
  GITHUB_REPO: nonEmptyString,
  GITHUB_TOKEN: nonEmptyString,
  JWT_SECRET: z.string().check(
    z.minLength(32, {
      error: 'JWT_SECRET must be at least 32 bytes of cryptographic entropy',
    }),
  ),
  KARMA_APP_TOKEN: nonEmptyString.optional(),
  KARMA_INTERNAL_TOKEN: nonEmptyString.optional(),
  NAVIGATOR_BASE_URL: nonEmptyString
    .optional()
    .default('https://www.uagenealogy.com'),
  NEXT_PUBLIC_SITE: nonEmptyString,
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  OAUTH_CLIENT_ID: z.string(),
  PORT: z.string().optional().default('4000'),
  POSTHOG_KEY: nonEmptyString,
  POSTHOG_HOST: nonEmptyString,
  TURNSTILE_SECRET_KEY: nonEmptyString,
  TURSO_DATABASE_URL: z.string().default('file:local.db'),
  TURSO_DATABASE_TOKEN: nonEmptyString.optional(),
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
  GITHUB_REPO: process.env.GITHUB_REPO,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  JWT_SECRET: process.env.JWT_SECRET,
  KARMA_APP_TOKEN: process.env.KARMA_APP_TOKEN,
  KARMA_INTERNAL_TOKEN: process.env.KARMA_INTERNAL_TOKEN,
  NAVIGATOR_BASE_URL: process.env.NAVIGATOR_BASE_URL,
  NEXT_PUBLIC_SITE: process.env.NEXT_PUBLIC_SITE,
  NODE_ENV: process.env.NODE_ENV,
  OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID,
  PORT: process.env.PORT,
  POSTHOG_KEY: process.env.POSTHOG_KEY,
  POSTHOG_HOST: process.env.POSTHOG_HOST,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  TURSO_DATABASE_TOKEN: process.env.TURSO_DATABASE_TOKEN,
  VALID_API_KEYS: process.env.VALID_API_KEYS,
});

export default environment;
