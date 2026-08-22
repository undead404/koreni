import findUserById from '../database/find-user-by-id.js';
import type { TranscribeContext } from '../types.js';

const handleTranscribeAuthMe = async (c: TranscribeContext) => {
  try {
    const user = await findUserById(c.var.userId);
    return c.json({ user });
  } catch {
    return c.json({ user: null }, 401);
  }
};

export default handleTranscribeAuthMe;
