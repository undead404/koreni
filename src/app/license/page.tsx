import { readFile } from 'node:fs/promises';

import renderMarkdown from '../helpers/render-markdown';

export default async function LicensePage() {
  const licenseMarkdownBuffer = await readFile('./LICENSE.md');
  const licenseHTML = await renderMarkdown(licenseMarkdownBuffer);

  return (
    <article className="col-sm">
      <h1>Ліцензія</h1>
      <p>
        Вміст Коренів заснований на праці багатьох осіб, вказаних на сторінках
        відповідних таблиць. Ці особи передали ці таблиці Кореням для поширення
        за ліцензією{' '}
        <a href="https://opendatacommons.org/licenses/odbl/">ODbL</a>. Повний
        текст ліцензії наведено нижче.
      </p>
      <p>
        Самі дані можна отримати{' '}
        <a href="https://github.com/undead404/koreni/tree/main/data">
          у директорії <code>data</code> на GitHub Коренів
        </a>
        .
      </p>
      <div dangerouslySetInnerHTML={{ __html: licenseHTML }} />
    </article>
  );
}
