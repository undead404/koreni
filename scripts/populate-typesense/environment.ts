import { z } from 'zod';

import dotenv from 'dotenv';

dotenv.config();

const nonEmptyString = z.string().min(1);

const environmentSchema = z.object({
  TYPESENSE_ADMIN_KEY: nonEmptyString,
  TYPESENSE_HOST: nonEmptyString,
});

const environment = environmentSchema.parse(process.env);

export default environment;
