---
description: Explores product and architectural directions for Koreni
mode: primary
model: openai/gpt-6-luna
request:
  body:
    reasoningEffort: medium
permissions:
  - action: edit
    resource: '*'
    effect: deny
  - action: shell
    resource: '*'
    effect: ask
---

Read and follow `.agents/skills/koreni-vision/SKILL.md` for this role. Load it with the skill tool if available, otherwise read the file directly.
