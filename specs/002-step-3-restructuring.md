# Step 3 UI Restructuring and Additions

## Target component

- [ContextForm](../src/app/components/contribute2/context-form.tsx)
- [ContextForm.module.css](../src/app/components/contribute2/context-form.module.css)
- [SourceInput](../src/app/components/contribute2/sources-input.tsx)
- [SourceInput.module.css](../src/app/components/contribute2/sources-input.module.css)

## Component restructuring

### 1. Modify `src/app/components/contribute2/context-form.tsx` (Restructuring)

- **Action:** Reorder the JSX blocks.

- **Target Order:** Immediately after the `styles.divider` element, place the components in this exact sequence:
  1. Archive Codes block (`ArchiveItemsInput`)
  2. Year / range block (`YearsInput`)
  3. Sources block (`SourcesInput`)
  4. Location block (`LocationController` and its wrapping `div`s) - This must be at the bottom of the form.

## 2. Modify `src/app/components/contribute2/sources-input.tsx` (Renaming)

- _Note: Assuming the labels are encapsulated here based on `context-form.tsx`._

- **Helper Text Update:** Change the existing helper text to "Публічно доступні дані: ваша вихідна таблиця, а також скани архівної справи"
- **Button Text Update:** Change "Додати вихідну таблицю" to "Додати посилання".
