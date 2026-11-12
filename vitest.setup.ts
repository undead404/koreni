import '@testing-library/jest-dom/vitest';
import dotenv from 'dotenv';
import { vi } from 'vitest';

dotenv.config({ path: '.env' });

vi.stubEnv('NEXT_PUBLIC_OAUTH_CLIENT_ID', 'test-oauth-client-id');

if (!process.env.NEXT_PUBLIC_GITHUB_REPO) {
  process.env.NEXT_PUBLIC_GITHUB_REPO = 'undead404/koreni';
}
if (!process.env.NEXT_PUBLIC_SITE) {
  process.env.NEXT_PUBLIC_SITE = 'http://localhost:3000';
}
if (!process.env.NEXT_PUBLIC_TYPESENSE_HOST) {
  process.env.NEXT_PUBLIC_TYPESENSE_HOST = 'http://localhost:8107';
}
if (!process.env.NEXT_PUBLIC_POSTHOG_HOST) {
  process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://eu.i.posthog.com';
}
