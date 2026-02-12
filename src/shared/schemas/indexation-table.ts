import { z } from 'zod';

import { nonEmptyString } from './non-empty-string';

export const indexationTableSchema = z.object({
  archiveItems: z
    .array(
      z.string().refine(
        (value) => {
          const regex =
            // eslint-disable-next-line regexp/no-obscure-range
            /^[А-ЯІа-яі]{3,}-[ДПР]?\d+[а-я]?-\d+[а-я]?-(?:\d+[а-я]?(?:Т\d+)?)?$/;
          const result = regex.test(value);
          return result;
        },
        {
          message:
            'Невалідний формат елемента archiveItems. Очікується (абревіатура архіву)-(номер фонду)-(номер опису)-(номер справи).',
        },
      ),
    )
    .optional(),
  author: z.string().optional(), // e.g., 'Андрій Мельник <a.melnyk@example.com>
  date: z
    .string()
    .transform((dateString) => new Date(dateString))
    .refine((date) => !Number.isNaN(date.getTime()), {
      message: 'Invalid date format. Expected ISO string.',
    }),
  id: z.string().min(1), // e.g., '1897-PZZ'
  tableFilename: nonEmptyString, // e.g., '1897-PZZ.csv'. Guaranteed to be unique across all tables.
  location: z.tuple([z.number(), z.number()]), // [latitude, longitude]
  size: z.number().min(1),
  sources: z.array(nonEmptyString),
  title: nonEmptyString, // e.g., 'По лінії ПЗЗ – Перший Всеросійський перепис 1897 року'. Guaranteed to be unique across all tables.
  tableLocale: z.enum(['pl', 'ru', 'uk']), // Supported locales for now
  yearsRange: z
    .array(z.number().min(1500).max(new Date().getFullYear()), {
      message: `Рік повинен бути в діапазоні між 1500 і ${new Date().getFullYear()}`,
    })
    .min(1)
    .max(2), // e.g., [1897] (single year) or [1919, 1921] (range)
});

export type IndexationTable = z.infer<typeof indexationTableSchema>;
