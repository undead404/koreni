# CSV file dropzone stays green after cancelling the file selection

## Background

The CSV file dropzone is controlled with [react-hook-form](https://react-hook-form.com/) and defined in `src/app/components/contribute/csv-dropzone.tsx`

The form is validated with [zod](https://github.com/colinhacks/zod), the schema is defined in `src/app/components/contribute/schema.ts`.

## The bug

Happens when a user drops a valid CSV file, then cancels the file selection (triggers the file input and then cancels the selection).

Expected behavior: the file dropzone becomes blank, as if the user had not selected a file.

Actual behavior: the file dropzone stays green, as if the user had selected a file, but validation fails and the user cannot proceed to the next step.

## Extra requirements

The fix must contain a unit test update that covers the bug.
