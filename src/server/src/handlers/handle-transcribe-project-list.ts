import getProjectsByUser from '../database/get-projects-by-user.js';
import type { TranscribeContext } from '../types.js';

const handleTranscribeProjectList = async (c: TranscribeContext) => {
  const projects = await getProjectsByUser(c.var.userId);
  return c.json({ projects });
};

export default handleTranscribeProjectList;
