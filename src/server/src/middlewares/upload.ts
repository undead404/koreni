import { bodyLimit } from 'hono/body-limit';

const uploadMiddleware = bodyLimit({
  maxSize: 50 * 1024 * 1024, // 50MB
  onError: (c) => {
    return c.json({ error: 'File too large' }, 413);
  },
});

export default uploadMiddleware;
