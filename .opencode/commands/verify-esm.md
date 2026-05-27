---
description: Scan a backend file to ensure all relative imports terminate in .js or .ts.
---

Execute this command on any newly modified file in `src/server/` before concluding your task. If the output flags any lines, fix the missing `.js` extensions immediately.

!`grep -E "^import .* from '\.[^']*[^js]';" $1 || echo "ESM import check passed."`
