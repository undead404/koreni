'use client';

import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { GridControlBar } from './grid-control-bar';
import { GridTable } from './grid-table';
import { useTableStateStore } from './table-state';
import type { ContributeForm2Values } from './types';
import { useGridPreview } from './use-grid-preview';

import styles from './data-grid.module.css';

export default function DataGrid() {
  const {
    getAllColumns,
    getTableAsObjects,
    getTableDimensions,
    setSkippedRowsAbove,
    skippedColumns,
    skippedRowsAbove,
    skippedRowsElsewhere,
    toggleColumn,
    toggleRow,
  } = useTableStateStore();

  const dataRows = getTableAsObjects(true);
  const columns = useMemo(() => getAllColumns(true), [getAllColumns]);

  const { topRows, bottomRows, hiddenCount, expandTop, expandBottom } =
    useGridPreview(dataRows);

  const flaggedColCount = skippedRowsElsewhere.size;
  const flaggedRowCount = skippedColumns.size;
  const totalFlagged = flaggedColCount + flaggedRowCount;

  const {
    formState: { errors },
    register,
  } = useFormContext<ContributeForm2Values>();

  return (
    <div className={styles.wrapper}>
      <GridControlBar
        dataRowsLength={dataRows.length}
        columnsCount={getTableDimensions().columns}
        skippedRowsAbove={skippedRowsAbove}
        totalFlagged={totalFlagged}
        setSkippedRowsAbove={setSkippedRowsAbove}
        register={register}
        errors={errors}
      />

      {skippedColumns.size > 0 && (
        <div className={styles.infoAlert}>
          ℹ️ Деякі колонки позначені для вилучення. Напевне, вони містять
          порожні, дубльовані або несуттєві дані. Щоб скасувати вилучення,
          натисніть піктограму відерця у заголовку.
        </div>
      )}

      {skippedRowsElsewhere.size > 0 && (
        <div className={styles.infoAlert}>
          ℹ️ Деякі ряди позначені для вилучення. Щоб скасувати вилучення,
          натисніть піктограму відерця зліва від ряду.
        </div>
      )}

      {skippedRowsAbove > 0 && (
        <div className={styles.infoAlert}>
          ℹ️ Перші ряди (над заголовками) зсунуті та ігноруються. Це значення
          можна змінити в налаштуваннях вище.
        </div>
      )}

      <GridTable
        columns={columns}
        skippedColumns={skippedColumns}
        skippedRowsElsewhere={skippedRowsElsewhere}
        skippedRowsAbove={skippedRowsAbove}
        topRows={topRows}
        bottomRows={bottomRows}
        hiddenCount={hiddenCount}
        toggleColumn={toggleColumn}
        toggleRow={toggleRow}
        expandTop={expandTop}
        expandBottom={expandBottom}
      />
    </div>
  );
}
