import z, { type ZodArray, type ZodNumber } from 'zod';

import { nonEmptyString } from '@koreni/shared/schemas/non-empty-string';

export const submissionIdSchema = z
  .string()
  .min(5, { message: 'Ідентифікатор має містити щонайменше 5 символів' })
  .max(128, { message: 'Ідентифікатор має містити не більше 128 символів' })
  .regex(/^[a-z0-9-]+$/i, {
    message: 'Лише латинські літери, цифри та дефіси',
  });
export type SubmissionId = z.infer<typeof submissionIdSchema>;

export const contributeFormSchema = z.object({
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
  id: submissionIdSchema,
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
      message: 'Виберіть алфавіт таблиці',
    }),
  title: z.string().min(1, {
    message: 'Введіть назву таблиці',
  }),
  yearsRange: z.preprocess<unknown, ZodArray<ZodNumber>, number[]>(
    (value: unknown): unknown => value ?? [],
    z
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
      }),
  ),
});

export const authorIdentitySchema = z.object({
  authorName: z.string(),
  authorEmail: z.string().optional(),
  authorGithubUsername: z.string().optional(),
});
export type AuthorIdentity = z.infer<typeof authorIdentitySchema>;

export const coordinatesStringAsTupleSchema = z
  .string()
  .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
  .transform((value) => {
    const [latString, longString] = value.split(',').map((s) => s.trim());
    const result = [Number(latString), Number(longString)] as [number, number];
    if (Number.isNaN(result[0]) || Number.isNaN(result[1])) {
      throw new TypeError('Invalid coordinates');
    }
    return result;
  });
