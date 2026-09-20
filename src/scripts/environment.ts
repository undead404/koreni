import dotenv from 'dotenv';
import { z } from 'zod';

// eslint-disable-next-line unicorn/no-top-level-side-effects
dotenv.config();

const nonEmptyString = z.string().min(1);

const environmentSchema = z.object({
  KARMA_APP_TOKEN: nonEmptyString,
  KARMA_INTERNAL_TOKEN: nonEmptyString,
  SITE: nonEmptyString,
  NAVIGATOR_BASE_URL: nonEmptyString
    .optional()
    .default('https://www.uagenealogy.com'),
});

const environment = environmentSchema.parse({
  KARMA_APP_TOKEN: process.env.KARMA_APP_TOKEN,
  KARMA_INTERNAL_TOKEN: process.env.KARMA_INTERNAL_TOKEN,
  SITE: process.env.SITE,
  NAVIGATOR_BASE_URL: process.env.NAVIGATOR_BASE_URL,
});

export default {
  appToken: environment.KARMA_APP_TOKEN,
  internalToken: environment.KARMA_INTERNAL_TOKEN,
  koreniServerUrl: environment.SITE.replace(/\/+$/, ''),
  navigatorBaseUrl: environment.NAVIGATOR_BASE_URL.replace(/\/+$/, ''),
} as const;
