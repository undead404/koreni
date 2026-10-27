---
description: Decomposes goals and compiles implementation-ready specifications
mode: primary
model: openai/gpt-6-luna
request:
  body:
    reasoningEffort: medium
permissions:
  - action: shell
    resource: '*'
    effect: ask
  - action: edit
    resource: '*'
    effect: deny
  - action: edit
    resource: specs/**
    effect: allow
  - action: edit
    resource: src/server/specs/**
    effect: allow
---

Read and follow `.agents/skills/koreni-plan/SKILL.md` for this role. Load it with the skill tool if available, otherwise read the file directly.
