---
description: Run Vitest for a specific Next.js route, automatically handling bracket escaping.
---

Run tests for a specific route. Provide the path to the test file.

!`file_path=$1; escaped_path=$(printf '%q' "$file_path"); set -f && yarn vitest run "$escaped_path"`
