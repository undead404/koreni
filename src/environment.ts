import { z } from "zod";

import dotenv from "dotenv";

dotenv.config();

const nonEmptyString = z.string().min(1);

const environmentSchema = z.object({
  NEXT_PUBLIC_BUGSNAG_API_KEY: nonEmptyString.optional(),
  NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: nonEmptyString,
  NEXT_PUBLIC_TYPESENSE_HOST: nonEmptyString,
});

const environment = environmentSchema.parse({
    NEXT_PUBLIC_BUGSNAG_API_KEY: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
    NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY,
    NEXT_PUBLIC_TYPESENSE_HOST: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
});

export default environment;
