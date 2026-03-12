import { z } from 'zod';

export const nonEmptyString = z.string().min(1, {
  message: 'Очікується хоча б один символ',
});
