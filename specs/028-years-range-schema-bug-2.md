# Bug with Contribute Form crash on years range field having null value

## Background

The contribute form is controlled with [react-hook-form](https://react-hook-form.com/) and defined in `src/app/components/contribute/contribute-form.tsx`

The form is validated with [zod](https://github.com/colinhacks/zod), the schema is defined in `src/app/components/contribute/schema.ts`.

Years range field is designed to accept a hyphenated range of years or a single year, like `1897-1921` or `1921`. It's defined in `src/app/components/contribute/years-input.tsx`.

## The bug

Happens when a user types a non-numeric character into the years range field.

Expected behavior: the app doesn't crash, the field is marked as invalid and the user can't submit the form.

Actual behavior: the app crashes with the following error:

```plain
TypeError: Cannot read properties of null (reading 'join')
    at YearsInput (years-input.tsx:39:54)
```

## Technical details

This means that the `yearsRange` field is not an array, despite the schema definition.

```ts
import z from 'zod';

export const contributeFormSchema = z.object({
  // Other fields
  yearsRange: z.preprocess<unknown, ZodArray<ZodNumber>, number[]>(
    (value: unknown): unknown =>
      value === null || value === undefined ? [] : value,
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
```

Assume the types are wrong, as TypeScript thinks that `yearsRange` is always a `number[]`.

## Extra requirements

The fix must contain a unit test update that covers the bug.
