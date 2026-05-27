import findProject from '../database/find-project.js';
import type { TranscribeContext } from '../types.js';

export default async function handleTranscribeProjectGet(c: TranscribeContext) {
  try {
    const projectId = c.req.param('projectId');
    if (!projectId) {
      return c.json({ error: 'Missing projectId' }, 400);
    }

    const project = await findProject(projectId, c.var.userId);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const isHandwritten = project.is_handwritten === 1;
    const location = [project.latitude, project.longitude];
    const tableLocale = project.locale;
    const yearsRange =
      project.year_start === project.year_end
        ? [project.year_start]
        : [project.year_start, project.year_end];

    let sources: string[] = [];
    try {
      sources = JSON.parse(
        (project.sources as string | null) || '[]',
      ) as string[];
    } catch {
      sources = [];
    }

    return c.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        type: project.type,
        isHandwritten,
        location,
        tableLocale,
        yearsRange,
        sources,
      },
    });
  } catch (error: unknown) {
    console.error('Error getting project:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
}
