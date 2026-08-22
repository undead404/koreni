---
description: Implement user-facing account linking interface where logged-in users enter their Navigator one-time code to connect Koreni and Navigator Karma.
status: draft
targets:
  - src/app/karma/connections/page.tsx
  - src/app/karma/connections/page.module.css
context:
  - karma-integration.md
  - karma-discussion.txt
  - CONVENTIONS.md
---

# User Account Linking Interface

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js 15 & React 19) — Zone A
- **Data Scope:** User session, input form for 10-character Navigator challenge code, link status display

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** Users visiting `/karma/connections` have no UI form to enter the one-time code shown on Navigator (`https://www.uagenealogy.com/karma/connections`).
- **Behavior:** No visual feedback or mechanism to trigger the account linking process.

### Target / Resolved State

- **Condition:** Authenticated user opens `/karma/connections`.
- **Behavior:**
  - Displays user's calculated Koreni contribution points (unique character count and points earned).
  - Displays connection status:
    - If `karma_linked_at` is set: shows "Акаунт успішно прив'язано до Генеалогічного навігатора" with timestamp.
    - If unlinked: renders input form for 10-character Navigator code (`AB12CD34EF`) with submit button "Прив'язати акаунт".
  - Submitting code POSTs to `/api/karma/link`. On success, updates state and shows confirmation message.

---

## 3. Execution Pipeline

### 3.1. src/app/karma/connections/page.tsx

1. Render current user link status and calculated contribution stats.
2. Render client component form for entering code from Navigator.
3. Handle submission, loading states, and error handling (`invalid_or_expired`, `already_linked`).

### 3.2. src/app/karma/connections/page.module.css

1. Style form, input, buttons, and status badges following design tokens.

---

## 4. Hard Constraints

- **React 19 & Next.js 15:** Use Client Component boundaries appropriately for interactive form handling.
- **Localization:** Ukrainian strings for all labels and error messages.

---

## 5. Agentic Verification

1. **Type & Lint Pass:**
   `yarn exec tsc --noEmit`
2. **Targeted Test Execution:**
   `yarn exec vitest src/app/karma/connections/page.test.tsx`
