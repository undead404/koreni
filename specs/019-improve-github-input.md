# Task: Enhance AuthorForm with Field-Specific Hints and Optional Labels

## Context

Beta feedback indicates that the GitHub field is confusing for non-technical contributors. We need to clarify that it is optional and explain its purpose without cluttering the UI.

## Requirements

1. **Update [`FieldConfig`](../src/app/components/contribute2/author-form.tsx) Interface**:
   - Add an optional `description: string` property.
   - Add an optional `isOptional: boolean` property (defaulting to false).

2. **Update [`FIELDS`](../src/app/components/contribute2/author-form.tsx) Constant**:
   - Add `isOptional: true` to `authorEmail`.
   - Add `isOptional: true` and a `description` to `authorGithubUsername`.
   - **Description text**: "Необов'язково. Потрібно лише якщо ви бажаєте пов'язати свій внесок з профілем на GitHub для історії розробки проєкту."

3. **UI Components Updates**:
   - **Labels**: If a field has `isOptional: true`, append a muted span `(необов'язково)` to the label.
   - **Field Descriptions**: Render the `description` text (if present) below the input but above the error message. Use a smaller, muted font size.
   - **Accessibility**: Use `aria-describedby` to link the input to its specific description ID.

4. **Styling ([`author-form.module.css`](../src/app/components/contribute2/author-form.module.css))**:
   - Define `.optionalLabel`: smaller font, reduced opacity, margin-left.
   - Define `.fieldDescription`: font-size 12px, color for secondary text, margin-top 4px.

## Implementation Details

### Component Logic

Modify the `.map()` loop in `AuthorForm` to:

- Generate a unique `descriptionId` for fields with descriptions.
- Include `descriptionId` in the `aria-describedby` attribute (handling multiple IDs if an error also exists).
- Render the description block using the new styles.

### Localization

Ensure all strings remain in Ukrainian as per the project's current state.
