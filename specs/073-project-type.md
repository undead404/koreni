# Project type field

## Description

`/api/transcribe/projects` endpoint now accepts another field – `type`. Add a field in `ProjectCreatePage` form component for it.

The field must allow to select between options. This field must be the first in the form, required. Initial value must be blank (unselected), so a user would need to select an option explicitly.

Available options must come from an async function `getProjectSchemas()`, which for now would return a hardcoded array:

```ts
const getProjectSchemas = async () => {
  return [
    {
      enabled: true,
      label: 'Late russian confession list',
      value: 'confession-list',
    },
    {
      enabled: false,
      label: 'Late russian parish register',
      value: 'parish-register',
    },
  ];
};
```

In the future, the function will request the list of schemas from the server; for now it's stubbed.

The `enabled` field is used to disable the option in the UI.

Also, there must be a disabled link with "Create new project" text, with a note that schema creation is not yet implemented.

## Relevant files

- `src/app/transcribe/create/page.tsx`
- `src/app/transcribe/create/page.module.css`
- `src/app/transcribe/services/api.ts`
- `src/server/src/handlers/handle-transcribe-project-create.ts`
- `src/server/src/schemata.ts`
