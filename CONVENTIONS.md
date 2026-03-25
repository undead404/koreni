# Project Conventions

## Technology Stack

- **Framework**: Next.js (App Router, SSG build)
- **Dev engine**: Node.js (^22.12), Yarn
- **Language**: TypeScript, JSX
- **Styling**: CSS Modules (`.module.css` imported as `styles`), global styles in `src/app/styles/global.css`
- **Validation**: Zod
- **Search Engine**: Typesense
- **Analytics**: PostHog
- **Error Handling**: Bugsnag

## File Structure & Naming

- **Directories**: Kebab-case (e.g., `src/app/components`, `src/populate-typesense`).
- **Files**: Kebab-case for both logic and components (e.g., `archive-item.tsx`, `get-table-metadata.ts`).
- **Component Exports**: Default exports are preferred for components and pages.
- **Function/Variable Naming**: CamelCase (e.g., `getVolunteers`, `archiveItem`).

## Component Guidelines

- **Props Interface**: Define prop types explicitly, often named `[ComponentName]Properties` or inline if simple (e.g., `ArchiveItem({ archiveItem }: { archiveItem: string })`).
- **State Management**: React hooks (`useState`, `useEffect`, `useSearchParams`).
- **Image Optimization**: Use `next/image` (`<Image />`).
- **Links**: Use `next/link` (`<Link />`).

## Data & Logic

- **Schemas**: Zod schemas are located in `src/**/schemas/` or `schemata.ts`. Type inference uses `z.infer`.
- **Helpers**: Utility functions live in `src/app/helpers/` or specific service directories.
- **Async Data**: Data fetching often happens in Server Components (`async function Page()`) or via service functions like `getTablesMetadata()`.

## Environment Variables

- Client-side variables are prefixed with `NEXT_PUBLIC_` (e.g., `environment.NEXT_PUBLIC_SITE`).
- Accessed via a centralized `environment` object/module (implied usage `environment.NEXT_PUBLIC_...`).

## Specific Implementations

- **Search**: Custom search implementation using Typesense, with helper scripts for Dockerizing and populating data.
- **Localization/Text**: Hardcoded Ukrainian text strings in components; specific helpers for transliteration (e.g., `slugifyUkrainian`, `transliterateIntoPolish`).
- **Blocking**: Specific logic to block access based on browser language preference (implied by `no-russians.tsx`).

## Appearance

- Always consider accessibility and responsiveness.
- Always consider dark mode preference.
- Use `clsx` for all conditional styling.

## Testing

- Unit tests have `.test.ts` or `.test.tsx` extensions.
- Always try to create unit tests for all components and services.
