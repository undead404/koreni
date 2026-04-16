# Redesign Search Controls Layout

## Objective

Fix the search controls UI layout. The current design stacks three full-width inputs, which is inefficient for 4-digit year fields. Refactor the CSS and TSX to group the "Year From" and "Year To" inputs side-by-side, occupying only the necessary width, while allowing the main search input to expand.

## File Modifications

### 1. `src/app/components/search-controls.module.css`

Replace the existing CSS with the following responsive layout rules:

```css
.container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 800px; /* Expanded slightly to accommodate inline layout */
  margin: 0 auto 24px auto;
}

@media (min-width: 640px) {
  .container {
    flex-direction: row;
    align-items: center;
  }
}

.inputGroup {
  flex: 1;
  display: flex;
  width: 100%;
}

.input {
  width: 100%;
  padding: 10px 16px;
  font-size: 1rem;
  border: var(--default-border);
  border-radius: 4px;
  outline: none;
  transition: border-color 0.3s ease;
}

.input:focus,
.yearInput:focus {
  border-color: var(--clickable-color);
}

.yearFilters {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

@media (min-width: 640px) {
  .yearFilters {
    width: auto;
  }
}

.yearInput {
  width: 100%;
  padding: 10px 12px;
  font-size: 1rem;
  border: var(--default-border);
  border-radius: 4px;
  outline: none;
  transition: border-color 0.3s ease;
  text-align: center;
}

/* Constrain year inputs on larger screens */
@media (min-width: 640px) {
  .yearInput {
    width: 100px;
  }
}

.separator {
  color: #666;
  font-weight: bold;
}
```

### 2. `src/app/components/search-controls.tsx`

Update the JSX structure to apply the new CSS classes:

- Wrap the primary text `<input>` in a `div` with `className={styles.inputGroup}`.
- Group the two year `<input>` elements inside a `div` with `className={styles.yearFilters}`.
- Change the `className` of the year inputs to `styles.yearInput`.
- Insert a `<span className={styles.separator}>-</span>` between the two year inputs to visually indicate a range.
