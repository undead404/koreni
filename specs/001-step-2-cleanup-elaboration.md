# Step 2: Cleanup Elaboration

## Target component

[DataGrid](../src/app/components/contribute2/data-grid.tsx)
[DataGrid.module.css](../src/app/components/contribute2/data-grid.module.css)

## Relevant state

`skippedColumns` holds a Set of indices of columns that were flagged for removal.
`skippedRowsAbove` holds number of rows that were flagged for removal at the top (they're above the header).
`skippedRowsElsewhere` holds a Set of indices of rows that were flagged for removal.

## UI implementation

- **Condition**: Render an informational alert or banner conditionally, only when columns are actively flagged for removal. Render another alert when rows are flagged for removal with `skippedRowsAbove`. Render a third alert when rows are flagged for removal with `skippedRowsElsewhere`.
- **Placement**: Insert this alert directly above the table preview or immediately adjacent to the red warning text ("X до вилучення") seen in the top right of the table wrapper.
- **Content**: Add a concise explanation in Ukrainian explaining the logic and reassuring the user.

## Styling

Use standard informational alert styling (e.g., a light blue or gray background, distinct from error states) to indicate this is a helpful system action, not a user error.
