import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: '../.env',
});

const nonEmptyString = z.string().min(1);

const environmentSchema = z.object({
  NEXT_PUBLIC_BUGSNAG_API_KEY: z.string().optional(),
  NEXT_PUBLIC_TYPESENSE_HOST: nonEmptyString,
});

const environment = environmentSchema.parse(process.env);

export default environment;
