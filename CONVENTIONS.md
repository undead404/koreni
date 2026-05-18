# AI Coding Conventions

## 1. Architecture & Next.js 15 Constraints

- **App Router Paradigm**: Default absolutely to React Server Components (RSC).
- **Client Components**: Add the `'use client'` directive at the very top of the file ONLY if the component requires `useState`, `useEffect`, `useSearchParams`, DOM APIs, or interactive event listeners.
- **Data Fetching**: Execute data fetching asynchronously within Server Components (`async function Page()`). Never fetch data in Client Components unless explicitly instructed.
- **Async Params**: In Next.js 15, `params` and `searchParams` in pages/layouts are asynchronous. Always `await` them before destructuring or reading.

## 2. TypeScript & Type Definitions

- **Strict Typing**: Never use `any`. Define explicit interfaces or types for all variables, function parameters, and return values.
- **Component Props**: Name prop interfaces explicitly as `[ComponentName]Properties` (e.g., `ArchiveItemProperties`). Avoid inline typing for anything more complex than a single primitive.
- **Zod Schemas**: Define validation in `src/**/schemas/` or `schemata.ts`. Always export inferred types alongside the schema using `export type X = z.infer<typeof XSchema>`.
- Never use `as` or other type assertions in TypeScript, except for `as unknown` when necessary. All uncertain values must be parsed with Zod.

## 3. File Structure & Naming Rules

- **Files & Directories**: Strictly use `kebab-case` for all files and folders (e.g., `archive-item.tsx`, `get-table-metadata.ts`).
- **Functions & Variables**: Strictly use `camelCase`.
- **Component Exports**: Use `export default function ComponentName` for all components and pages. Avoid named exports for React components unless grouping multiple sub-components in a single file.

## 4. Styling & UI

- **CSS Modules**: Use `.module.css`. Import strictly as `import styles from './[name].module.css'`.
- **Conditional Classes**: Use `clsx` exclusively for combining or conditionally applying class names.
- **Next.js Built-ins**: Use `next/image` (`<Image />`) for all media and `next/link` (`<Link />`) for all routing.
- **Accessibility**: Use semantic HTML elements (`<button>`, `<nav>`, `<main>`). Ensure all interactive elements have `aria-labels` if lacking visible text.
- **Theme**: Ensure all custom CSS accounts for both light and dark modes via media queries or standardized CSS variables.

## 5. Domain-Specific Logic

- **Environment Variables**: Access client-exposed variables strictly via your centralized `environment` object (e.g., `environment.NEXT_PUBLIC_SITE`). Do not use `process.env.NEXT_PUBLIC_*` directly in components.
- **Localization**: Hardcode Ukrainian strings directly into components. Utilize specific helpers (`slugifyUkrainian`, `transliterateIntoPolish`) for data transformation.
- **Regional Blocking**: Do not modify or bypass the routing logic inside `no-russians.tsx` or related middleware.

## 6. Testing (Node.js 22 & Vitest)

- **Coverage**: Generate `.test.ts` or `.test.tsx` files for every new component or service utility.
- **Syntax**: Use Vitest (`describe`, `it`, `expect`).
- **Execution Command**: When providing terminal commands to run specific tests with dynamic route brackets, always escape the brackets with quotes (e.g., `vitest run "src/app/[tableId]/page.test.tsx"`).
