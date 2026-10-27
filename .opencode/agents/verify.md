---
description: Independently reviews bounded changes and verifies acceptance criteria
mode: subagent
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
    effect: allow
---

Read and follow `.agents/skills/koreni-verify/SKILL.md` for this role. Load it with the skill tool if available, otherwise read the file directly.
