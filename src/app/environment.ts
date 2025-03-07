import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const nonEmptyString = z.string().min(1);

const environmentSchema = z.object({
  NEXT_PUBLIC_BUGSNAG_API_KEY: z.string().optional(),
  NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: nonEmptyString,
  NEXT_PUBLIC_TYPESENSE_HOST: nonEmptyString,
  NEXT_PUBLIC_SITE: nonEmptyString,
});

const environment = environmentSchema.parse({
  NEXT_PUBLIC_BUGSNAG_API_KEY: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
  NEXT_PUBLIC_TYPESENSE_SEARCH_KEY:
    process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY,
  NEXT_PUBLIC_TYPESENSE_HOST: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
  NEXT_PUBLIC_SITE: process.env.NEXT_PUBLIC_SITE,
});

export default environment;
