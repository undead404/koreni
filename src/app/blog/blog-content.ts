import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

const BLOG_DIRECTORY = path.join(process.cwd(), 'data', 'blog');
const FRONT_MATTER_DELIMITER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const blogFrontMatterSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  date: z.iso.date(),
  author: z.string().trim().min(1),
  draft: z.boolean(),
  tags: z.array(z.string().trim().min(1)).optional(),
});

export type BlogFrontMatter = z.infer<typeof blogFrontMatterSchema>;

export interface BlogArticle extends BlogFrontMatter {
  content: string;
  slug: string;
}

function getSlug(fileName: string): string {
  const extension = path.extname(fileName);
  const slug = path.basename(fileName, extension);
  const result = slugSchema.safeParse(slug);

  if (!result.success || extension !== '.md') {
    throw new Error(
      `Invalid blog filename '${fileName}'. Expected a lowercase slug ending in .md.`,
    );
  }

  return result.data;
}

export function parseBlogArticle(
  fileName: string,
  source: string,
): BlogArticle {
  const slug = getSlug(fileName);
  const match = FRONT_MATTER_DELIMITER.exec(source);

  if (!match) {
    throw new Error(
      `Blog article '${fileName}' is missing valid front matter.`,
    );
  }

  let frontMatter: unknown;
  try {
    frontMatter = parseYaml(match[1]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid front matter in '${fileName}': ${message}`);
  }

  const parsed = blogFrontMatterSchema.safeParse(frontMatter);
  if (!parsed.success) {
    throw new Error(
      `Invalid front matter in '${fileName}': ${parsed.error.message}`,
    );
  }

  return {
    ...parsed.data,
    content: match[2].trimStart(),
    slug,
  };
}

function sortArticles(first: BlogArticle, second: BlogArticle): number {
  const dateOrder = second.date.localeCompare(first.date);
  return dateOrder || first.slug.localeCompare(second.slug);
}

export async function getBlogArticles(): Promise<BlogArticle[]> {
  const directoryEntries = await readdir(BLOG_DIRECTORY);
  const fileNames = directoryEntries.filter(
    (fileName) => fileName.endsWith('.md') && fileName !== 'README.md',
  );
  const articles = await Promise.all(
    fileNames.map(async (fileName) =>
      parseBlogArticle(
        fileName,
        await readFile(path.join(BLOG_DIRECTORY, fileName), 'utf8'),
      ),
    ),
  );

  return articles.filter((article) => !article.draft).sort(sortArticles);
}

export async function getBlogArticle(
  slug: string,
): Promise<BlogArticle | undefined> {
  const articles = await getBlogArticles();
  return articles.find((article) => article.slug === slug);
}
