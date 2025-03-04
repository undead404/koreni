import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const nonEmptyString = z.string().min(1);

const environmentSchema = z.object({
  TYPESENSE_ADMIN_KEY: nonEmptyString,
  NEXT_PUBLIC_TYPESENSE_HOST: nonEmptyString,
});

const environment = environmentSchema.parse(process.env);

export default environment;
