export default function skipFromTable(
  tableData: string[][],
  {
    skippedRowsAbove,
    skippedRowsElsewhere,
    skippedColumns,
  }: {
    skippedRowsAbove: number;
    skippedRowsElsewhere: Set<number>;
    skippedColumns: Set<number>;
  },
) {
  return tableData
    .filter(
      (_, rowIndex) =>
        rowIndex >= skippedRowsAbove && !skippedRowsElsewhere.has(rowIndex),
    )
    .map((row) => row.filter((_, colIndex) => !skippedColumns.has(colIndex)))
    .slice(1);
}
