---
description: Implement page name guessing logic based on the previous two page names
status: draft
targets:
  - src/app/transcribe/workspace/_components/page-name-form.tsx
context:
  - src/app/transcribe/workspace/page.tsx
---

# Page Name Guessing Implementation

## 1. Architectural Boundary

- **Execution Context:** Client (Next.js & React 19)
- **Data Scope:** Local State

---

## 2. State Transition Matrix

### Fault / Current State

- **Condition:** The user currently has to manually type the page name for every single image, even when it follows a predictable sequence.
- **Behavior:** The `PageNameForm` initializes the input with an empty string or the current image's existing `pageName`. It does not attempt to predict the next page name.
- **Log/Trace:**

```ts
// pageNameInput is simply initialized to the current image's pageName or an empty string
setPageNameInput(image.pageName || '');
```

### Target / Resolved State

- **Condition:** The `PageNameForm` mounts or the `image` changes, and the current image does not have a `pageName` yet.
- **Behavior:** The component analyzes the previous two images' page names and populates `pageNameInput` with a guessed value if a known pattern is matched. The guess is not automatically submitted; the user must click "Save".
- **Schema/Type Alteration:**

```ts
interface PageNameFormProperties {
  projectId: string;
  image: ProjectImage | undefined;
  onImageUpdated: (updatedImage: ProjectImage) => void;
  // Need the full list of images to inspect previous pages and check for untitled ones
  images?: ProjectImage[];
}
```

---

## 3. Execution Pipeline

### 3.1. src/app/transcribe/workspace/\_components/page-name-form.tsx

1. Update the `PageNameFormProperties` interface to receive the `images` array (sorted in the correct order).
2. Create a helper function (e.g., `guessNextPageName(currentIndex: number, images: ProjectImage[])`) that implements the following exact rules:
   - If this page is the 1st or 2nd (`currentIndex < 2`), return `null` (skip guessing).
   - If there are untitled pages before the current one (`images.slice(0, currentIndex).some(img => !img.pageName)`), return `null`.
   - Let `prev2` be the page name of the page before the previous one (`images[currentIndex - 2].pageName`).
   - Let `prev1` be the page name of the previous one (`images[currentIndex - 1].pageName`).
   - Parse integer numbers `N` and `M` where applicable.
   - If `prev2` is "N" and `prev1` is "M", where N and M are numbers and N + 1 = M, guess `(M + 1).toString()`.
   - If `prev2` is "Nзв" and `prev1` is "M", where N and M are numbers and N + 1 = M, guess `"Mзв"`.
   - If `prev2` is "N" and `prev1` is "Nзв", guess `(N + 1).toString()`.
   - If `prev2` is "N" and `prev1` is "Nа", guess `(N + 1).toString()`.
   - If `prev2` is "Na" and `prev1` is "M", where N + 1 = M, guess `(M + 1).toString()`. (Note: 'a' and 'а' may be mixed, handle parsing gracefully).
   - If `prev2` is "Nзв" and `prev1` is "Nа", guess `"Nазв"`.
   - If `prev2` is "Nа" and `prev1` is "Naзв", guess `(N + 1).toString()`.
   - Otherwise, return `null` (don't guess).
3. Update the `useEffect` that listens to `image` and `images`. If `image.pageName` is missing, calculate the guess using the helper function. If a guess is produced, set it via `setPageNameInput(guessedName)`.
4. Ensure the guess only populates the input field without submitting it (the `disabled` logic or submit handling should remain user-initiated).

### 3.2. Parent Component (e.g. workspace page or context)

1. Ensure the `PageNameForm` component is passed the `images` array from the current project so that it has the required context to perform the guessing logic.

---

## 4. Agentic Verification

Execute the following commands to validate the implementation:

1. **Type & Lint Pass:** Run standard formatting and type checks.

```bash
   ./scripts/opencode-check.sh src/app/transcribe/workspace/_components/page-name-form.tsx
```

2. **Targeted Test Execution:** Add unit tests to verify the guessing logic algorithm covers all the rules accurately.

```bash
   yarn test src/app/transcribe/workspace/_components/page-name-form.test.tsx
```
