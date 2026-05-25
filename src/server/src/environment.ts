import dotenv from 'dotenv';
import { z } from 'zod';

import { nonEmptyString } from './schemata.js';

dotenv.config();

const environmentSchema = z.object({
  BUGSNAG_API_API_KEY: nonEmptyString.optional(),
  GITHUB_OAUTH_CLIENT_ID: nonEmptyString.optional(),
  GITHUB_OAUTH_CLIENT_SECRET: nonEmptyString.optional(),
  GITHUB_REPO: nonEmptyString,
  GITHUB_TOKEN: nonEmptyString,
  JWT_SECRET: z.string().check(
    z.minLength(32, {
      error: 'JWT_SECRET must be at least 32 bytes of cryptographic entropy',
    }),
  ),
  NEXT_PUBLIC_SITE: nonEmptyString,
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  OAUTH_CLIENT_ID: z.string(),
  PORT: z.string().optional().default('4000'),
  POSTHOG_KEY: nonEmptyString,
  POSTHOG_HOST: nonEmptyString,
  R2_ACCOUNT_ID: nonEmptyString.optional(),
  R2_ACCESS_KEY_ID: nonEmptyString.optional(),
  R2_SECRET_ACCESS_KEY: nonEmptyString.optional(),
  R2_BUCKET_NAME: nonEmptyString.optional(),
  R2_PUBLIC_URL: z.url().optional(),
  TURNSTILE_SECRET_KEY: nonEmptyString,
  TURSO_DATABASE_URL: z.url(),
  TURSO_DATABASE_TOKEN: nonEmptyString,
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
  JWT_SECRET: process.env.JWT_SECRET,
  NEXT_PUBLIC_SITE: process.env.NEXT_PUBLIC_SITE,
  NODE_ENV: process.env.NODE_ENV,
  OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID,
  PORT: process.env.PORT,
  POSTHOG_KEY: process.env.POSTHOG_KEY,
  POSTHOG_HOST: process.env.POSTHOG_HOST,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  TURSO_DATABASE_TOKEN: process.env.TURSO_DATABASE_TOKEN,
  VALID_API_KEYS: process.env.VALID_API_KEYS,
});

export default environment;
