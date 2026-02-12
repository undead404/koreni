import type { Handler } from 'hono';

// Hono handler for health check
const handleHealth: Handler = (c) => {
  return c.json({ status: 'ok' });
};

export default handleHealth;
