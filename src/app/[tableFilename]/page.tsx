import { Suspense } from "react";

import getTableData from "@/shared/get-table-data";
import getTablesMetadata from "@/shared/get-tables-metadata";

import IndexTable from "../components/index-table";
import MapWrapper from "../components/map-wrapper";
import getTableMetadata from "../helpers/get-table-metadata";

import styles from "./page.module.css";

export default async function Table({
  params,
}: {
  params: Promise<{ tableFilename: string }>;
}) {
  const { tableFilename } = await params;
  const tableFilenameDecoded = decodeURIComponent(decodeURIComponent(tableFilename));
  const tableMetadata = await getTableMetadata(tableFilenameDecoded);
  const tableData = await getTableData(tableMetadata);
  return (
    <article className={styles.article}>
      <h1>{tableMetadata.title}</h1>
      <div className={styles.tableContainer}>
        <h3>Дані</h3>
        <MapWrapper
          coordinates={tableMetadata.location}
          title={tableMetadata.title}
        />
        <Suspense fallback={<div className={styles.suspenseFallback}>Завантаження...</div>}>
          <IndexTable data={tableData} />
        </Suspense>
      </div>
    </article>
  );
}

export async function generateStaticParams() {
  const tablesMetadata = await getTablesMetadata();
  return tablesMetadata.map((tableMetadata) => ({
    tableFilename: encodeURIComponent(tableMetadata.tableFilename),
  }));
}