---
description: Update ProjectsList component to link each project item to `/transcribe/transcribe/?projectId=[projectId]`.
targets:
  - src/app/transcribe/components/projects-list.tsx
context:
  - src/app/transcribe/components/projects-list.tsx
---

# Link Projects to Transcribe Page Specification

## Description

Each project item in the `ProjectsList` component rendered on the transcribe index page should link to the individual transcribe page for that project.
Since the individual transcribe page doesn't exist yet, the target path is `/transcribe/transcribe/?projectId=[projectId]`.

## 1. Context & Scope

- **Target Component:** `ProjectsList` in `src/app/transcribe/components/projects-list.tsx`
- **Related Files:**
  - `src/app/transcribe/components/projects-list.tsx`
  - `src/app/transcribe/schemata.ts` (for the `Project` type structure)

## 2. Current Behavior (Actual)

Each project item is currently rendered as a plain `<p>` text element displaying the project title:

```tsx
{
  projects.map((project) => <p key={project.id}>{project.title}</p>);
}
```

## 3. Expected Behavior (Target)

Each project item must be wrapped or replaced with a Next.js `<Link>` component that navigates to `/transcribe/transcribe/?projectId=[projectId]` using the project's ID.

```tsx
import Link from 'next/link';

// ...

{
  projects.map((project) => (
    <Link
      href={`/transcribe/transcribe/?projectId=${project.id}`}
      key={project.id}
    >
      {project.title}
    </Link>
  ));
}
```

## 4. Constraints & Technical Requirements

- Import `Link` correctly from `'next/link'`.
- Retain the key prop `key={project.id}` on the outermost element of each list item.
- Ensure TypeScript compiles successfully.

## 5. Testing Directives

### Recommended Test File: `src/app/transcribe/components/projects-list.test.tsx`

If writing unit tests using Vitest and React Testing Library:

1. **Mock API calls**: The component calls `getProjects` from `../api/get-projects`. This should be mocked using `vi.mock` to return a resolved promise with mock project data.
2. **Verify Navigation Elements**: Verify that each mock project renders as a link (with tag name `A`) with an `href` matching `/transcribe/transcribe/?projectId=[projectId]`.
