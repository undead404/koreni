---
description: Generate isolated Vitest suite for the GitHub webhook service
targets:
  - src/server/src/services/github.test.ts
context:
  - src/server/src/services/github.ts
  - src/server/TESTING_CONVENTIONS.md
---

# GitHub Service Unit Tests

## Domain-Specific Requirements

- **Webhook Payload**: Pass malformed GitHub webhook payloads to ensure Zod validation catches them.
- **SDK Mocking**: Specifically mock the GitHub Octokit client instantiated within the service.
- **Unhappy Path**: Force the mocked Octokit client to reject with a `401 Unauthorized` error and verify telemetry fires.
