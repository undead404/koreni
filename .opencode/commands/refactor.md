---
description: 'Refactor a specific file for performance, architectural alignment, and readability.'
model: 'opencode/gemini-3-flash'
temperature: 0.1
top_p: 0.95
max_tokens: 8192
---

You are a principal software engineer. Review the target file injected below and apply the requested refactoring structural improvements.

Target File Content: $1
Refactoring Goal: $2

1. Execute the refactoring strictly based on the Refactoring Goal. If no specific goal is provided, optimize the file for complexity reduction (lower cyclomatic complexity) and dead-code elimination.
2. **Preserve Public Contracts:** Do not alter exported function signatures, React component prop interfaces, or public API endpoints unless explicitly commanded in the goal. Adjacent files must not break.
3. **Type Integrity:** Maintain or elevate TypeScript type safety. Downgrading type strictness or injecting `any`/`as` to bypass compilation constraints is strictly prohibited.
4. **No Code Truncation:** You must output the entire file content back to disk. Do not use omission placeholders such as `// ... existing code ...`.
5. **Verification Loop:** After writing the file to disk, you MUST invoke the project's verification pipeline by executing:

```bash
   /lint
```

!`if [ -z "$1" ]; then echo "ERROR: You must specify a file path to refactor."; exit 1; fi; echo "Refactoring $1..."`
