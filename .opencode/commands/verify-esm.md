---
description: 'Scan a backend file to ensure all relative imports terminate with an explicit extension.'
model: 'opencode/gemini-3-flash'
temperature: 0.1
top_p: 0.90
max_tokens: 4096
---

You are a precise ESM conformity tool. Review the flagged import lines and the target file content below.

Target file content: @$1

1. If the terminal payload is exactly `ESM_PASSED`, output "✓ ESM extensions valid." and terminate immediately.
2. If lines are flagged, analyze the target file and append the explicit `.js` extension to all relative imports (paths starting with `./` or `../`) that currently lack an extension.
3. For static assets or data files (e.g., `.json`, `.css`), ensure their explicit extensions are preserved.
4. Write the corrected file back to disk and terminate. Do not add comments or explanations.

!`if [ -z "$1" ]; then echo "ERROR: No file provided"; exit 1; fi; flagged=$(grep -E "(import|export).*['\"]\.{1,2}/" "$1" | grep -E -v "\.(js|cjs|mjs|ts|tsx|jsx|json|css|scss)['\"]"); if [ -z "$flagged" ]; then echo "ESM_PASSED"; else echo "$flagged"; fi`
