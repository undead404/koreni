---
description: Executes bounded informal implementation and repair tasks
mode: primary
model: openai/gpt-6-luna
request:
  body:
    reasoningEffort: medium
permissions:
  - action: edit
    resource: '*'
    effect: allow
  - action: shell
    resource: '*'
    effect: allow
---

Read and follow `.agents/skills/koreni-execute/SKILL.md` for this role. Load it with the skill tool if available, otherwise read the file directly.
