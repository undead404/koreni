---
description: Reduce unnecessary repository-wide specification context in OpenCode research agents.
status: implementation-ready
targets:
  - .opencode/agents/investigate.md
  - .opencode/agents/vision.md
context:
  - README.md
  - src/server/src/database/schema.sql
  - specs/
  - src/server/specs/
---

<Specification>

# Bound OpenCode Agent Context for Repository Specs

<Architecture>

- **Goal:** Reduce unnecessary prompt-context tokens for the `investigate` and `vision` agents by replacing their repository-wide specification context inclusions with on-demand retrieval of relevant specs.
- **System boundary:** OpenCode agent prompt configuration only. These files are tooling configuration and belong to neither Zone A nor Zone B. Do not change frontend or server source.
- **Exact target files and operations:**
  - `.opencode/agents/investigate.md`: remove the directory-wide `@specs/` and `@src/server/specs/` context directives. Retain the existing package, convention, and testing-convention context. Add an instruction to locate and read only the specifications relevant to the reported defect before diagnosing it.
  - `.opencode/agents/vision.md`: remove the directory-wide `@specs/` and `@src/server/specs/` context directives. Retain `@README.md` and `@src/server/src/database/schema.sql`. Add an instruction to discover and read only relevant specifications before making repository-grounded proposals.
- **Retrieval pattern:** Use the existing read-only search/read tools to locate candidate specification paths from the task’s domain and terminology, then read the selected files. Do not preload or read every spec by default. If relevance cannot be established, state that uncertainty rather than inventing repository capabilities.
- **Explicitly out of scope:** Do not change `openai/gpt-6-luna`, `reasoningEffort`, `subagent_depth`, provider configuration, OpenAI dashboard limits, command output-token settings, or retry behavior. Do not add a plugin, API client, automated retry mechanism, or new tool.
- **Rationale and uncertainty:** The observed error is a TPM rejection: 95,374 tokens were already used, the attempted request was estimated at 113,900, exceeding the 200,000 TPM limit by 9,274 tokens; the response requested a 2.782-second wait. Repository-wide spec inclusions in these two agents are a concrete, avoidable source of prompt size. The error alone does not prove which agent produced that request or that these inclusions account for most of its tokens; this change is a bounded reduction, not a guarantee against TPM limits.

</Architecture>

<DataFlow>

1. On `investigate` or `vision` invocation, load the agent’s concise static prompt and its remaining explicitly retained context.
2. Before making repository-specific claims, derive search terms and relevant domains from the user’s task.
3. Search specification locations for candidate documents and read only those that match the task. Use additional targeted searches only when the first set does not establish the relevant contract.
4. Base conclusions on the selected documents and inspected source context; identify missing or contradictory evidence explicitly.
5. No application state, project data, API request, database record, or user file is mutated by this workflow.

</DataFlow>

<FailureModes>

- **Relevant spec not found:** Do not treat search failure as proof that no specification exists. Report the search scope and uncertainty; broaden targeted terms or ask for clarification.
- **Several candidate specs match:** Read the candidates needed to distinguish their scope and applicability; do not fall back to loading the entire spec corpus.
- **Spec context is insufficient or contradictory:** Report the conflict and defer conclusions that depend on it.
- **Conversation context remains large:** This prompt change does not bound accumulated conversation history, context added by the user, or context loaded by other agents. It does not guarantee that a request will fit within 200,000 TPM.
- **Provider rate-limit error:** Do not claim that this change fixes the organization’s TPM ceiling. It does not alter OpenAI rate limits or other sessions sharing the organization/project.
- **Tool availability:** Use only existing search and read capabilities. Do not add shell-based writes, retries, or new mechanisms.

</FailureModes>

<TestPlan>

- **Exact automated test files:** None. This is a prompt/configuration-only change; the repository has no established OpenCode prompt unit-test harness. Do not invent one or add application tests.
- **Mock boundaries:** None; no external API calls, OpenAI request mocks, or model-provider tests are required.
- **Configuration validation:** Run `opencode debug config` and confirm the config loads with both `investigate` and `vision` available and no missing instruction/context paths.
- **Static prompt assertions:** Inspect the two target prompts and assert that neither contains a directory-wide `@specs/` or `@src/server/specs/` inclusion; each must instead direct task-scoped search and selective reading. Confirm retained README/schema and convention references remain as specified.
- **Sequential behavior checks:** In separate, sequential OpenCode sessions, give `investigate` a defect topic represented in an existing spec and give `vision` a product topic represented in an existing spec. Assert each agent locates and cites relevant spec paths, does not claim to have loaded the full corpus, and reports uncertainty if no relevant spec is found. Do not run these checks concurrently.
- **Acceptance boundary:** These checks validate selective retrieval behavior, not a fixed token reduction or elimination of 429 responses. If available, compare request-token usage for equivalent tasks before and after; treat provider-reported measurements as evidence, not an assumed result.

</TestPlan>

</Specification>
