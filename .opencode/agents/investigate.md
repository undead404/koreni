---
description: Diagnoses defects, reproduces issues, and performs root-cause analysis without modifying code
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
    effect: allow
---

Read and follow `.agents/skills/koreni-investigate/SKILL.md` for this role. Load it with the skill tool if available, otherwise read the file directly.
