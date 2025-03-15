import { remark } from 'remark';
import html from 'remark-html';

export default async function renderMarkdown(
  markdown: Buffer,
): Promise<string> {
  const vFile = await remark().use(html).process(markdown);
  const htmlResult = vFile.toString();
  return htmlResult;
}
