import { readFile } from 'node:fs/promises';

import { remark } from 'remark';
import html from 'remark-html';

export default async function LicensePage() {
  const licenseMarkdownBuffer = await readFile('./LICENSE.md');
  const licenseHTMLVFile = await remark()
    .use(html)
    .process(licenseMarkdownBuffer);
  const licenseHTML = licenseHTMLVFile.toString();

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
      <section dangerouslySetInnerHTML={{ __html: licenseHTML }} />
    </article>
  );
}
