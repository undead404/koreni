import { z } from "zod";

import { nonEmptyString } from "./non-empty-string";

export const indexationTableSchema = z.object({
  tableFilename: nonEmptyString,
  location: z.tuple([z.number(), z.number()]),
  sources: z.array(nonEmptyString),
  title: nonEmptyString,
  tableLocale: z.enum(["ru", "uk"]),
});

export type IndexationTable = z.infer<typeof indexationTableSchema>;