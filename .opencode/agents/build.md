---
description: Executes bounded specifications with evidence-driven escalation
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

Read and follow `.agents/skills/koreni-build/SKILL.md` for this role. Load it with the skill tool if available, otherwise read the file directly.
