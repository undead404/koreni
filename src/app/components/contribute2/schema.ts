import z from 'zod';

import { nonEmptyString } from '@/shared/schemas/non-empty-string';

export const contributeForm2Schema = z.object({
  archiveItems: z
    .array(
      z.object({
        item: nonEmptyString,
      }),
    )
    .min(1, {
      message: 'Повинна бути вказана хоча б одна архівна справа',
    }),
  authorEmail: z
    .email({ message: 'Введіть справжню адресу електронної пошти' })
    .optional(),
  authorGithubUsername: z
    .union([
      z.literal(''),
      z.string().regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, {
        message: 'Лише латинські літери, цифри та дефіси',
      }),
    ])
    .optional(),
  authorName: z.string().min(1, {
    message: "Будь ласка, введіть своє ім'я, або хоча б псевдонім",
  }),
  id: z
    .string()
    .min(1, {
      message:
        'Введіть ідентифікатор таблиці, що містить лише латинські літери, цифри та дефіси',
    })
    .regex(/^[a-z0-9-]+$/i, {
      message: 'Лише латинські літери, цифри та дефіси',
    }),
  location: z
    .string()
    .min(1, {
      message:
        'Знайдіть у пошуку або введіть координати в форматі "широта,довгота"',
    })
    .refine(
      (value) => {
        const coords = value.split(',').map(Number);
        return (
          coords.length === 2 &&
          coords.every((element) => Number.isFinite(element))
        );
      },
      {
        message:
          'Неправильний формат координат. Очікується рядок у форматі "широта,довгота".',
      },
    ),
  sources: z.array(
    z.object({
      url: z.url({
        message: 'Адреса URL повинна бути справжньою',
      }),
    }),
  ),
  table: z
    .unknown()
    .nullable()
    .refine(
      (fileList) => {
        if (typeof FileList === 'undefined') return true; // Skip on server
        return fileList instanceof FileList && fileList.length > 0;
      },
      {
        message: 'Виберіть файл CSV',
      },
    ),
  tableLocale: z
    .enum(['pl', 'ru', 'uk', ''])
    .nullable()
    .refine((value) => value, {
      message: 'Виберіть мову таблиці',
    }),
  title: z.string().min(1, {
    message: 'Введіть назву таблиці',
  }),
  yearsRange: z
    .array(
      z.number().min(1500, {
        message: 'Ви ввели рік до 1500. Впевнені, що не помилилися?',
      }),
    )
    .min(1, {
      message: 'Введіть рік, або діапазон років – через дефіс: 1897-1921',
    })
    .max(2, {
      message: 'Введіть рік, або діапазон років – через дефіс: 1897-1921',
    })
    .refine((value) => value !== null, {
      message: 'Введіть рік, або діапазон років – через дефіс: 1897-1921',
    }),
});

export const authorIdentitySchema = z.object({
  authorName: z.string(),
  authorEmail: z.string().optional(),
  authorGithubUsername: z.string().optional(),
});
export type AuthorIdentity = z.infer<typeof authorIdentitySchema>;
