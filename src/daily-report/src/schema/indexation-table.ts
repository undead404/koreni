import { z } from 'zod';

import { nonEmptyString } from './non-empty-string.js';

export const indexationTableSchema = z.object({
  archiveItems: z.array(nonEmptyString).min(1),
  authorName: nonEmptyString,
  authorEmail: nonEmptyString.optional(),
  date: z
    .string()
    .transform((dateString) => new Date(dateString))
    .refine((date) => !Number.isNaN(date.getTime()), {
      message: 'Invalid date format. Expected ISO string.',
    }),
  id: z.string().min(1), // e.g., '1897-PZZ'
  tableFilePath: nonEmptyString, // e.g., 'data/records/1897-PZZ.csv'. Guaranteed to be unique across all tables.
  location: z.tuple([z.number(), z.number()]), // [latitude, longitude]
  size: z.number().min(1),
  sources: z.array(nonEmptyString),
  title: nonEmptyString, // e.g., 'По лінії ПЗЗ – Перший Всеросійський перепис 1897 року'. Guaranteed to be unique across all tables.
  tableLocale: z.enum(['pl', 'ru', 'uk']), // Supported locales for now
  yearsRange: z
    .array(z.number().min(1500).max(new Date().getFullYear()), {
      message: `Рік повинен бути в діапазоні між 1500 і ${
        new Date().getFullYear() - 75
      }`,
    })
    .min(1)
    .max(2), // e.g., [1897] (single year) or [1919, 1921] (range)
});

export type IndexationTable = z.infer<typeof indexationTableSchema>;
