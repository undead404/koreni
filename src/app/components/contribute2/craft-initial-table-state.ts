export default function craftInitialTableState(table: string[][]) {
  const [columns = [], ...rows] = table;
  const skippedRowsAbove = 0;
  const skippedRowsElsewhere = new Set(
    rows
      .entries()
      .filter(([, row]) => row.every((cell) => !cell || cell === '-'))
      .map(([index]) => index),
  );
  const unskippedRows = rows.filter(
    (row, index) => !skippedRowsElsewhere.has(index),
  );
  const [firstRow, ...otherRows] = unskippedRows;
  const skippedColumns = new Set(
    columns
      .entries()
      .filter(([index]) =>
        otherRows.every((row) => row[index] === firstRow[index]),
      )
      .map(([index]) => index),
  );
  return {
    tableData: table,
    tableFileName: '',
    skippedRowsAbove,
    skippedRowsElsewhere,
    skippedColumns,
  };
}
