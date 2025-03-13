import { readFile } from 'node:fs/promises';

import styles from './page.module.css';

export default async function LicensePage() {
  const licenseMarkdownBuffer = await readFile('./LICENSE.md');
  const licenseMarkdown = licenseMarkdownBuffer.toString();

  return (
    <article className={styles.root}>
      <h1>Ліцензія</h1>
      <section>
        <p>
          Вміст Коренів заснований на праці багатьох осіб, вказаних на сторінках
          відповідних таблиць. Ці особи передали ці таблиці Кореням для
          поширення за ліцензією{' '}
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
        <pre dangerouslySetInnerHTML={{ __html: licenseMarkdown }}></pre>
      </section>
    </article>
  );
}
