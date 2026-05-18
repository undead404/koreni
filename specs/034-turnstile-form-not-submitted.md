# Form not submitted

## 1. Context & Scope

- **Target Module:** `src/app/components/contribute/use-submit-contribution.ts`
- **Related Files:** `src/app/components/contribute/step.tsx`
- **Trigger State:** form submission

## 2. Current Behavior (Actual)

- **Structural Issue:** Form not submitted, no request sent on form submission. Instead, these warnings are logged to the console:

```plain
Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://challenges.cloudflare.com') does not match the recipient window's origin ('https://koreni.org.ua').
```

```plain
The resource https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/cmg/1 was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally.
```

## 3. Expected Behavior (Target)

- **Structural Goal:** Humanity checked with Turnstile, form submitted.
