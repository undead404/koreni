---
description: 'Automatically generate a backend unit test for a given source file.'
model: 'opencode/claude-sonnet-4-6'
temperature: 0.1
top_p: 0.95
max_tokens: 8192
---

You are a strict backend testing engineer. Review the execution context below containing the target source code and testing conventions.

1. **Context Verification:** Analyze the target file's imports. If the file relies on complex internal services, database schemas, or utilities, you MUST use your bash tool to `cat` those dependency files to understand their interfaces BEFORE writing your mocks. Do not hallucinate mock signatures.
2. **File Generation:** Generate a comprehensive unit test file (`*.test.ts`) that precisely mirrors the source path (e.g., `src/server/src/db/auth.ts` -> `src/server/src/db/auth.test.ts`).
3. **Convention Enforcement:** Strictly apply the rules defined in `./src/server/TESTING_CONVENTIONS.md`. Do not invent custom mocking strategies, test data factories, or assertion patterns.
4. **Isolation:** Do not write integration tests. Isolate external dependencies using the project's standard mocking paradigm.
5. **Verification Loop:** After writing the file, you MUST invoke the project's test runner on that specific file to verify the test passes. If it fails, resolve the errors autonomously before terminating. Do not narrate your actions.

### Execution Context

!`if [ -z "$1" ]; then echo "ERROR: Target file not provided. Usage: /scaffold-test-server <file_path>"; exit 1; fi; if [ ! -f "$1" ]; then echo "ERROR: Source file '$1' not found."; exit 1; fi; echo "=== TESTING CONVENTIONS ==="; cat src/server/TESTING_CONVENTIONS.md 2>/dev/null || echo "WARNING: TESTING_CONVENTIONS.md not found."; echo -e "\n=== TARGET SOURCE: $1 ==="; cat "$1"`
