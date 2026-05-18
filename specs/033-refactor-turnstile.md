# Refactor Turnstile

Refactor `ContributeForm.tsx` and `useSubmitContribution.ts` to replace passive Turnstile state management with an imperative, Promise-based execution model to fix stale token and race condition issues.

## Relevant Files

- `src/app/components/contribute/use-submit-contribution.ts`
- `src/app/components/contribute/contribute-form.tsx`

## Plan

### 1. In `ContributeForm.tsx`

- Remove `const [turnstileToken, setTurnstileToken] = useState('');`.
- Add a ref to hold the Promise resolver: `const turnstileResolver = useRef<((token: string) => void) | null>(null);`.
- Add an imperative function to request a token:

```typescript
const executeTurnstile = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    turnstileResolver.current = resolve;
    turnstile.reset();
    // Assuming react-turnstile exposes an execute method or requires a ref.
    // If turnstile object from useTurnstile() does not have execute(),
    // add a ref to the <Turnstile/> component to call .execute() on it.
    // Fallback: If execution="execute" is used, call the method that triggers the challenge.
  });
};
```

- Update the `<Turnstile />` component definition.
- Remove `refreshExpired="auto"`.
- Add `execution="execute"` (to prevent it from running on mount).
- Modify `onVerify`: `<Turnstile onVerify={(token) => { if (turnstileResolver.current) turnstileResolver.current(token); }} ... />`
- Ensure any timeout or error resets the promise or rejects it appropriately.

- Update the arguments passed to `useSubmitContribution`: replace `turnstileToken` and `turnstile` with `executeTurnstile`.

### 2. In `useSubmitContribution.ts`

- Update `UseSubmitContributionProperties`:
- Remove `turnstileToken: string;`
- Remove `turnstile: { reset: () => void };`
- Add `executeTurnstile: () => Promise<string>;`

- Inside the `submit` function:
- Remove the synchronous check `if (!turnstileToken)`.
- Add the imperative call at the start of the try block, right before preparing `tableData`:

```typescript
setContributionState({ ...contributionState, stage: 'verification' });
const freshToken = await executeTurnstile();
if (!freshToken)
  throw new Error('Не вдалося отримати токен перевірки на людяність');
```

- Assign `adjustedFormData.turnstileToken = freshToken;`.
- Inside the `catch` block:
- Remove the conditional statement `if (message.includes('Turnstile') || message.includes('перевірку'))`.
- The Turnstile reset logic is now handled internally by `executeTurnstile` on the next submission attempt. However, if the API call fails, the current token is burned. Rely on `executeTurnstile` calling `turnstile.reset()` before its next execution. You do not need to call reset here anymore.

## Extra requirements

Ensure strict TypeScript typings and preserve all existing PostHog analytics and generic error handling.
