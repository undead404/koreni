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
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;
  const tableMetadata = await getTableMetadata(tableId);
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
        <Suspense
          fallback={
            <div className={styles.suspenseFallback}>Завантаження...</div>
          }
        >
          <IndexTable tableId={tableId} data={tableData} />
        </Suspense>
      </div>
    </article>
  );
}

export async function generateStaticParams() {
  const tablesMetadata = await getTablesMetadata();
  const result = tablesMetadata.map((tableMetadata) => ({
    tableId: `${tableMetadata.id}`,
  }));
  return result;
}
