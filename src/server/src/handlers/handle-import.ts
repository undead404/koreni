import type { Context } from 'hono';
import yaml from 'yaml';
import { ZodError } from 'zod';

import { countCsvRows } from '../helpers/count-csv-rows';
import notifyAboutError from '../helpers/notify-about-error';
import { importPayloadSchema } from '../schemata';
import submitToGithub from '../services/github';

const handleImport = async (c: Context) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const metadataString = formData.get('metadata') as string | null;

    if (!file) {
      return c.json({ error: 'CSV file is required' }, 400);
    }

    if (!metadataString) {
      return c.json({ error: 'Metadata JSON is required' }, 400);
    }

    let metadata;
    try {
      const rawMeta = JSON.parse(metadataString) as unknown;
      const parseResult = importPayloadSchema.safeParse(rawMeta);

      if (!parseResult.success) {
        return c.json({ error: parseResult.error.format() }, 400);
      }
      metadata = parseResult.data;
    } catch (error) {
      notifyAboutError(error as Error);
      if (error instanceof ZodError) {
        return c.json({ error: error.format() }, 400);
      }
      return c.json({ error: `${error as Error}` }, 400);
    }

    const slugId = metadata.id;
    const csvContent = await file.text();
    const size = countCsvRows(csvContent);

    const yamlData = {
      ...metadata,
      date: new Date(),
      tableFilename: `${slugId}.csv`,
      size: size,
    };
    const yamlContent = yaml.stringify(yamlData);

    const prResult = await submitToGithub(
      [
        {
          path: `data/tables/${slugId}.csv`,
          content: csvContent,
          mode: '100644',
          type: 'blob',
        },
        {
          path: `data/tables/${slugId}.yml`,
          content: yamlContent,
          mode: '100644',
          type: 'blob',
        },
      ],
      {
        id: yamlData.id,
        title: yamlData.title,
      },
    );

    return c.json({
      success: true,
      message: 'Import processed and PR created',
      prUrl: prResult.htmlUrl,
    });
  } catch (error) {
    notifyAboutError(error as Error);
    return c.json({ error: `${error as Error}` }, 500);
  }
};

export default handleImport;
