---
description: 'Automatically generate a backend unit test for a given source file.'
model: 'opencode/gemini-3-flash'
temperature: 0.3
top_p: 0.95
max_tokens: 8192
---

You are a strict backend testing engineer. Read the conventions and the target file below.

Context files:

- @src/server/TESTING_CONVENTIONS.md
- Target source file: @$1

1. Generate a comprehensive unit test file (`*.test.ts`) that precisely mirrors the source path (e.g., if target is `src/server/src/db/auth.ts`, create `src/server/src/db/auth.test.ts`).
2. Strictly enforce the rules defined in `TESTING_CONVENTIONS.md`. Do not invent custom mocking strategies.
3. Do not write integration tests. Isolate external dependencies using standard mocking.
4. Write the test file to disk and terminate the operation immediately. Do not explain your code.

!`source_file=$1; echo "Generating test for $source_file..."`
