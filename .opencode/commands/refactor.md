---
description: 'Refactor a specific file for performance, architectural alignment, and readability.'
model: 'opencode/claude-opus-4-6
temperature: 0.1
top_p: 0.90
max_tokens: 8192
---

You are a principal software engineer. Review the execution context below and apply the requested structural improvements to the target file.

1. **Execute the Goal:** Refactor the file strictly based on the provided `REFACTORING_GOAL`.
2. **Preserve Public Contracts:** Do not alter exported function signatures, React component prop interfaces, or public API endpoints unless explicitly commanded. Adjacent files must not break.
3. **Type Integrity:** Maintain or elevate TypeScript type safety. Downgrading type strictness or injecting `any`/`as` to bypass compilation constraints is strictly prohibited.
4. **Context Safety:** If the refactoring requires understanding imported dependencies, you MUST `cat` those adjacent files using your bash tool before applying changes.
5. **Mutation & Verification:** Apply your changes using your native file editing tool. Immediately after writing to disk, you MUST verify your refactoring by executing `./scripts/opencode-check.sh`. If it fails, resolve the errors autonomously before terminating.

### Execution Context

!`if [ -z "$1" ]; then echo "ERROR: Target file not provided. Usage: /refactor <file_path> \"[goal]\""; exit 1; fi; if [ ! -f "$1" ]; then echo "ERROR: File '$1' not found."; exit 1; fi; echo "TARGET_FILE: $1"; echo "REFACTORING_GOAL: ${2:-'Optimize for complexity reduction and dead-code elimination.'}"; echo "---"; cat "$1"`
