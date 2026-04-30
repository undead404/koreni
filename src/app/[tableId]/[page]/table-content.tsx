import Link from 'next/link';

import ArchiveItem from '@/app/components/archive-item';
import Comments from '@/app/components/comments/comments';
import Details from '@/app/components/details';
import IndexTable from '@/app/components/index-table';
import MapWrapper from '@/app/components/map-wrapper';
import Pagination from '@/app/components/pagination';
import SourceLink from '@/app/components/source-link';
import { PER_PAGE } from '@/app/constants';
import slugifyUkrainian from '@/app/helpers/slugify-ukrainian';
import combinedPoints from '@/app/services/map-points';
import { IndexationTable } from '@/shared/schemas/indexation-table';

import styles from './page.module.css';

interface TableContentProperties {
  tableMetadata: IndexationTable;
  tableData: Record<string, unknown>[];
  page: number;
  tableId: string;
  totalRecords: number;
  jsonLd: string | null;
}

export default function TableContent({
  tableMetadata,
  tableData,
  page,
  tableId,
  totalRecords,
  jsonLd,
}: TableContentProperties) {
  const {
    title,
    authorName,
    sources,
    yearsRange,
    archiveItems,
    location,
    tableLocale,
  } = tableMetadata;

  const totalPages = Math.ceil(totalRecords / PER_PAGE);

  return (
    <>
      <article className={styles.article}>
        <h1>{title}</h1>
        <section>
          <h2>Метадані</h2>
          <p>
            Виконавець індексації:{' '}
            <Link href={`/volunteers/${slugifyUkrainian(authorName)}/`}>
              {authorName}
            </Link>
          </p>
          <p>
            Таблиці:{' '}
            {sources.map((source, index) => (
              <span key={source}>
                {index > 0 && ', '}
                <SourceLink href={source} />
              </span>
            ))}
          </p>
          <p>Охоплені роки: {yearsRange.join('-')}</p>
          <Details
            open={archiveItems.length < 4}
            summary={<h3>Використані архівні справи</h3>}
            sectionName="archive_items"
          >
            <ul className={styles.archiveItems}>
              {archiveItems.map((archiveItem) => (
                <ArchiveItem archiveItem={archiveItem} key={archiveItem} />
              ))}
            </ul>
          </Details>
          <Details summary={<h3>На карті</h3>} sectionName="map">
            <MapWrapper center={location} points={combinedPoints} zoom={8} />
          </Details>
        </section>
        <section>
          <h2 id="table-data">Дані</h2>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            urlBuilder={(p: number) => `/${tableId}/${p}`}
          />
          <div
            role="region"
            aria-labelledby="table-data"
            className={styles.tableContainer}
          >
            <IndexTable
              data={tableData}
              locale={tableLocale}
              page={page}
              tableId={tableId}
            />
          </div>
        </section>
      </article>
      <Comments />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        ></script>
      )}
    </>
  );
}
