import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const nonEmptyString = z.string().min(1);

const environmentSchema = z.object({
  BUGSNAG_API_API_KEY: nonEmptyString,
  GITHUB_OWNER: nonEmptyString,
  GITHUB_REPO: nonEmptyString,
  GITHUB_TOKEN: nonEmptyString,
  NEXT_PUBLIC_SITE: nonEmptyString,
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().optional().default('4000'),
  TURNSTILE_SECRET_KEY: nonEmptyString,
});

const environment = environmentSchema.parse({
  BUGSNAG_API_API_KEY: process.env.BUGSNAG_API_API_KEY,
  GITHUB_OWNER: process.env.GITHUB_OWNER,
  GITHUB_REPO: process.env.GITHUB_REPO,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  NEXT_PUBLIC_SITE: process.env.NEXT_PUBLIC_SITE,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
});

export default environment;
