# Hide logout button

## Description

Currently logout button is visible all the time. It should be hidden when user is not logged in.
Whether a user is logged in or not is determined by a `/api/auth/me` endpoint response. If the response is `200`, the user is logged in. Otherwise, the user is not logged in.

## Relevant files

- `src/app/transcribe/components/transcribe-header.tsx`
- `src/app/transcribe/components/logout-button.tsx`
- `src/app/transcribe/components/logout-button.module.css`
- `src/app/transcribe/components/user.tsx`

## Technical requirements

The `'/api/auth/me'` request must be debounced, not to make a request twice on the same page load. Use best practices to cache the response.
