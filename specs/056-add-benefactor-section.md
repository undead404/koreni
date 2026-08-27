---
description: Add a "Меценати" (Benefactors) section to the About page recognizing Serhii Fazulianov as the first financial patron of Koreni, with links to his personally-authored Facebook and SMM-managed Instagram profiles. Introduce a typed data module for benefactor entries to enable future growth.
status: completed
targets:
  - src/app/about/benefactors.ts
  - src/app/about/page.tsx
  - src/app/about/page.module.css
  - src/app/about/benefactors.test.ts
  - src/app/about/page.test.tsx
context:
  - CONVENTIONS.md
  - TESTING_CONVENTIONS.md
---

# Add Benefactor Recognition Section to About Page

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js 15 & React 19) — Frontend Zone A
- **Data Scope:** Static editorial content; no API calls, no server-side fetching, no state transitions
- **Component Type:** React Server Component (no `'use client'` directive required)

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** The About page (`/about`) acknowledges code contributors (Alina Listunova) and communities, but has no recognition for financial patrons.
- **Behavior:** Serhii Fazulianov's 2500 UAH contribution is unacknowledged on the public website, despite being the first monetary support for the project.
- **Impact:** No visible pathway for future financial supporters to understand that patronage is welcomed or valued.

### Target / Resolved State

- **Condition:** A new "Меценати" (Benefactors) subsection is added to the "Подяки" (Thanks) section on the About page.
- **Behavior:**
  - Serhii Fazulianov is listed with his name linked to his personally-authored Facebook profile (`https://www.facebook.com/S.Fazulyanov`).
  - A secondary link to his SMM-managed Instagram (`https://www.instagram.com/fazu.genealogy/`) is provided in parentheses.
  - The descriptor "генеалог, перший меценат Коренів" (genealogist, first patron of Koreni) is rendered.
  - The "Як можна допомогти?" (How to help?) section gains a new paragraph acknowledging financial support as a third modality of contribution.
  - The existing contributor list is reorganized under a new "Учасники та спільноти" (Contributors and Communities) subheading to maintain semantic hierarchy parity.

- **Data Model:**

```ts
export interface BenefactorEntry {
  name: string; // Full name in Ukrainian nominative case
  descriptor: string; // Short descriptor phrase (e.g., "генеалог")
  primaryUrl: string; // Primary link (personally-authored profile)
  secondaryUrl?: string; // Secondary link (SMM-managed portfolio, optional)
  secondaryLabel?: string; // Display label for secondary link (e.g., "Instagram")
  isFirst: boolean; // Whether this is the inaugural patron
}

export const BENEFACTORS: BenefactorEntry[] = [
  {
    name: 'Сергій Фазульянов',
    descriptor: 'генеалог',
    primaryUrl: 'https://www.facebook.com/S.Fazulyanov',
    secondaryUrl: 'https://www.instagram.com/fazu.genealogy/',
    secondaryLabel: 'Instagram',
    isFirst: true,
  },
];
```

---

## 3. Detailed Specifications

### 3.1. New Data Module: `src/app/about/benefactors.ts`

- **Purpose:** Single source of truth for benefactor data; enables future growth without JSX surgery.
- **Exports:**
  - `BenefactorEntry` interface: Typed shape for each benefactor entry.
  - `BENEFACTORS` constant: Array of benefactor entries.
- **Constraints:**
  - No React imports; no JSX; no side effects.
  - All URLs must start with `https://`.
  - If `secondaryUrl` is defined, `secondaryLabel` must also be defined.
  - At most one entry may have `isFirst: true`.

### 3.2. Updated Page Component: `src/app/about/page.tsx`

#### A. Import Statement

```tsx
import { BENEFACTORS } from './benefactors.js';
```

Note: The `.js` extension is required per Zone A conventions (Next.js ESM).

#### B. Structural Changes to "Подяки" Section

1. Insert a new `<h3>Меценати</h3>` heading immediately after the introductory `<p>Уклінно дякую наступним особам і спільнотам:</p>`.
2. Render the benefactor list via `.map()` over `BENEFACTORS`:

```tsx
<h3>Меценати</h3>
<ul className={styles.benefactorList}>
  {BENEFACTORS.map((benefactor) => (
    <li key={benefactor.name}>
      <a
        href={benefactor.primaryUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {benefactor.name}
      </a>
      {' '}–{' '}
      {benefactor.descriptor}
      {benefactor.isFirst && ', перший меценат Коренів'}
      {benefactor.secondaryUrl && (
        <>
          {' '}
          (
          <a
            href={benefactor.secondaryUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {benefactor.secondaryLabel}
          </a>
          )
        </>
      )}
    </li>
  ))}
</ul>
```

3. Add a new `<h3>Учасники та спільноти</h3>` heading immediately before the existing contributor `<ul>`.
4. The existing contributor list remains unchanged in content; only its heading structure is elevated.

#### C. New Paragraph in "Як можна допомогти?" Section

Insert a new `<p>` before the existing closing paragraph:

```tsx
<p>
  Якщо бажаєте підтримати проєкт фінансово – напишіть на{' '}
  <a href="mailto:admin@koreni.org.ua">admin@koreni.org.ua</a>.
</p>
```

### 3.3. CSS Module Updates: `src/app/about/page.module.css`

Add new classes for visual distinction of the benefactor list:

```css
.benefactorList {
  border-left: 3px solid var(--clickable-color);
  padding-inline-start: 1rem;
  padding-left: 0;
}

.benefactorList li {
  list-style: none;
  margin: 6px 0;
  font-size: 1rem;
  line-height: 1.4em;
}
```

Additionally, fix a pre-existing bug in the `.accent:hover` rule:

```css
.accent:hover {
  border-bottom-color: var(
    --clickable-color
  ); /* was: var(--accent-color) which doesn't exist */
}
```

- **Rationale:**
  - The left border accent visually separates the benefactor list from the plain contributor list, signaling its distinct role.
  - `list-style: none` is applied to `.benefactorList li` (the list items) to remove bullet markers per CSS semantics.
  - `padding-left: 0` on the `<ul>` overrides the global `ul:not(.no-disc)` rule's `padding-left: 20px`, allowing `padding-inline-start: 1rem` to control spacing.
  - The `.benefactorList li` rule ensures consistent spacing and typography matching the rest of the article.
- **Design Tokens:** Uses existing `--clickable-color` variable (defined in `globals.css` for both light and dark modes); no new CSS variables introduced.
- **Dark Mode:** Automatically supported via existing variable definitions. In light mode, `--clickable-color` is `#344cb7` (blue); in dark mode, it's `#a3bbf9` (lighter blue).

---

## 4. Hard Constraints

- **React 19 & Next.js 15:** The About page is a React Server Component; no `'use client'` directive is required or permitted.
- **Zone A Conventions:** All external links must carry `target="_blank" rel="noopener noreferrer"`. All internal links use `next/link`.
- **Ukrainian Strings:** All text is hardcoded in Ukrainian; no i18n layer.
- **CSS Modules:** All new styles are scoped to `page.module.css`; no global CSS modifications.
- **Type Safety:** The `BenefactorEntry` interface is defined exclusively in `benefactors.ts` and imported into `page.tsx`. No duplication or extraction to shared types.
- **Data Immutability:** `BENEFACTORS` is a constant array; no runtime mutations.
- **Semantic HTML:** Heading levels must follow the chain: `<h1>` → `<h2>Подяки</h2>` → `<h3>Меценати</h3>` and `<h3>Учасники та спільноти</h3>`.

---

## 5. Testing Directives

### 5.1. Data Module Tests: `src/app/about/benefactors.test.ts`

Unit tests for the `benefactors.ts` module in isolation:

```ts
describe('BENEFACTORS constant');
it('is a non-empty array');
it('has at most one entry with isFirst: true');
it('every entry has a non-empty name');
it('every entry has a valid primaryUrl starting with https://');
it('every entry with a secondaryUrl also has a secondaryLabel');
it('Serhii Fazulianov entry has correct shape');
```

### 5.2. Page Integration Tests: `src/app/about/page.test.tsx`

Extend the existing test file with new suites:

```ts
describe('AboutPage - Меценати section');
it('renders the Меценати h3 heading');
it('renders Serhii Fazulianov name linked to Facebook profile');
it('renders the secondary Instagram link');
it('renders the first benefactor descriptor text');
it('renders the Учасники та спільноти h3 heading');

describe('AboutPage - Як можна допомогти section');
it('renders the financial support paragraph');

describe('AboutPage - existing Подяки entries regression');
it('still renders Alina Listunova entry');
it('still renders UAGenealogy Facebook link');
it('still renders УГФ link');
```

### 5.3. Verification Commands

```bash
yarn exec tsc --noEmit
yarn exec vitest src/app/about/benefactors.test.ts src/app/about/page.test.tsx --run
```

---

## 6. Future Extensibility

The `benefactors.ts` module is designed to scale:

- **Adding a second benefactor:** Simply append a new entry to the `BENEFACTORS` array. The `isFirst` flag on the inaugural patron remains `true`; subsequent patrons have `isFirst: false`.
- **Removing the "first" distinction:** When historical context becomes irrelevant, set all `isFirst` flags to `false` or remove the conditional rendering in `page.tsx`.
- **Extracting to a database:** If benefactor data grows beyond a few entries, the constant can be replaced with a server-side fetch without changing the component's render logic.

---

## 7. Implementation Notes

- **No payment infrastructure:** This spec recognizes patronage but does not implement a donation mechanism. The email link in the new paragraph is a placeholder for future integration (Monobank jar, PayPal, etc.).
- **Privacy & Consent:** Serhii Fazulianov has explicitly consented to public recognition. Future benefactors must provide explicit consent before being added to `BENEFACTORS`.
- **Link Stability:** Both Facebook and Instagram URLs are hardcoded. If Serhii changes his handle, the links must be manually updated. This is acceptable for a small, curated list.
- **Semantic Hierarchy:** The introduction of `<h3>` subheadings under `<h2>Подяки</h2>` is correct and improves document outline clarity. The heading chain is: `<h1>` → `<h2>` → `<h3>`.
