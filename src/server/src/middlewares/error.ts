import { ErrorHandler } from 'hono';

import notifyAboutError from '../helpers/notify-about-error';

const errorMiddleware: ErrorHandler = (error, c) => {
  notifyAboutError(error);

  return c.json({ error: 'Internal Server Error' }, 500);
};

export default errorMiddleware;
