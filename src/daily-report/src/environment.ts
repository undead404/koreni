import dotenv from 'dotenv';
import { z } from 'zod';

import { nonEmptyString } from './schema/non-empty-string.js';

dotenv.config();

const environmentSchema = z.object({
  TELEGRAM_BOT_TOKEN: nonEmptyString,
  TELEGRAM_CHAT_ID: nonEmptyString,
});

const environment = environmentSchema.parse({
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
});

export default environment;
