import Link from 'next/link';

import ArchiveItem from '@/app/components/archive-item';
import CommentsWrapped from '@/app/components/comments-wrapped';
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
  const sourcesLinks = tableMetadata.sources.map((source, index) => (
    <span key={source}>
      {index > 0 && ', '}
      <SourceLink href={source} />
    </span>
  ));

  const authorName = tableMetadata.authorName ?? 'невідомі';

  const totalPages = Math.ceil(totalRecords / PER_PAGE);

  return (
    <>
      <article className={styles.article}>
        <h1>{tableMetadata.title}</h1>
        <section>
          <h2>Метадані</h2>
          <p>
            Виконавець індексації:{' '}
            <Link href={`/volunteers/${slugifyUkrainian(authorName)}/`}>
              {authorName}
            </Link>
          </p>
          <p>Таблиці: {sourcesLinks}</p>
          <p>Охоплені роки: {tableMetadata.yearsRange.join('-')}</p>
          {tableMetadata.archiveItems && (
            <Details
              open={tableMetadata.archiveItems.length < 4}
              summary={<h3>Використані архівні справи</h3>}
              sectionName="archive_items"
            >
              <ul className={styles.archiveItems}>
                {tableMetadata.archiveItems.map((archiveItem) => (
                  <ArchiveItem archiveItem={archiveItem} key={archiveItem} />
                ))}
              </ul>
            </Details>
          )}
          <Details summary={<h3>На карті</h3>} sectionName="map">
            <MapWrapper
              center={tableMetadata.location}
              points={combinedPoints}
              zoom={8}
            />
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
            tabIndex={0}
            className={styles.tableContainer}
          >
            <IndexTable
              data={tableData}
              locale={tableMetadata.tableLocale}
              page={page}
              tableId={tableId}
            />
          </div>
        </section>
      </article>
      <CommentsWrapped />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        ></script>
      )}
    </>
  );
}
