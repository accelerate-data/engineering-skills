# Implementing Linear Issue Handoffs

> **Status:** Draft

## Overview

`implementing-linear-issue` owns the local implementation phase for an existing
Linear issue. It should not absorb every upstream design, planning, debugging,
documentation, or review workflow. The skill should route to the strongest
available specialist skill when the issue context shows that implementation is
not ready, while keeping normal code changes inside the implementation workflow.

## Key Decisions

| Decision | Rationale |
|---|---|
| Use hard gates before implementation for thinking, design, and planning handoffs | These workflows change scope or strategy; implementation should resume only after the upstream artifact or decision exists. |
| Keep `superpowers:test-driven-development` inside implementation slices | TDD is the coding discipline for behavior changes, not a separate planning artifact. |
| Use `superpowers:systematic-debugging` before fixing reported bugs | A bug issue needs reproduction and root cause before implementation; TDD then captures the regression fix. |
| Use `authoring-design-spec` as the design handoff name | The docs-skills worktree exposes `authoring-design-spec` as the concrete skill for developer-facing design specs. |
| Add local references for refactor and interface planning instead of vendoring external skill contracts | The external skills are useful patterns, but this repository should own its workflow language and keep eval prompts scenario-driven. |
| Keep the main skill as a concise workflow spine | Detailed discovery, quality-gate, and Linear-update rules belong in focused references so the skill is readable without losing contract strength. |
| Require a User Flow label and matching functional-spec folder | Implementation should stop if Linear lacks the User Flow label or `docs/functional/<User Flow label>/` is missing. |
| Linear updates must reference source artifacts | Implementation updates should cite the functional spec, related design docs, and related implementation plan so reviewers can trace work to intent. |
| Quality gates must run through independent subagents | Code, simplification, test coverage, and acceptance-criteria reviews should not reuse the implementation context or become inline self-review. |
| Code review uses `superpowers:requesting-code-review` | The Superpowers review workflow owns the code-review subagent prompt and feedback handling. |
| Test coverage review uses `superpowers:requesting-code-review` | Use the Superpowers review workflow with a test-coverage-focused brief so coverage is judged independently. |
| Simplification review uses `code-simplifier` | The repository-owned simplification skill is the correct lens for behavior-preserving clarity review. |
| Trigger handoffs from issue and codebase evidence, not from generic complexity words alone | The skill should mimic an agent reading a real issue and repository, not recite a static routing table. |
| Cover natural user language in evals | Eval prompts should look like normal operator instructions, not labels such as "complex scope" or "multi-module trigger." |
| Keep PR and closeout handoffs out of implementation | `raising-linear-pr` and `closing-linear-issue` own those phases after the implementation worktree is clean and committed. |

## Handoff Matrix

| Condition | Handoff | Gate |
|---|---|---|
| Issue has no User Flow label | Stop and report the missing label | Hard stop before clarification or implementation planning |
| `docs/functional/<User Flow label>/` does not exist | Stop and report the missing functional spec folder | Hard stop before clarification or implementation planning |
| Issue has a User Flow label and matching functional-spec folder | Read the local document under `docs/functional/<User Flow label>/` | Required discovery before clarification or implementation planning |
| Issue, functional spec, or codebase terms imply design context | Search `docs/design/` for related design documents | Required discovery before clarification or implementation planning |
| A related implementation plan exists or is created | Track the `docs/plan/` path | Required traceability for Linear updates |
| User says "think through this first", "review the approach", "let's brainstorm", "don't just start coding", or similar | `superpowers:brainstorming` | Hard gate before implementation edits |
| Discovery leaves true forks, unresolved options, or unclear product/design choices | `superpowers:brainstorming` | Hard gate before implementation planning |
| Functional behavior or product flow is missing, stale, or disputed | `authoring-functional-spec` | Hard gate before design or implementation |
| User or codebase evidence shows architecture, data model, security, migration, permissions, auditability, or another durable design gap | `authoring-design-spec` | Hard gate before implementation plan |
| Issue requires a major refactor or behavior-preserving structural change | Read `references/refactor-planning.md`; use `superpowers:writing-plans`; use `authoring-design-spec` first if boundaries or architecture change | Hard gate before implementation edits |
| Issue requires API, module, component, or UI interface design with no approved shape | Read `references/interface-design.md`; use `authoring-design-spec` for durable interface decisions | Hard gate before implementation plan |
| Hard gates and clarification are resolved | `superpowers:writing-plans` creates the implementation plan | Hard gate before implementation edits |
| Behavior-changing code is being implemented | `superpowers:test-driven-development` | Required inside each implementation slice |
| Test design, coverage, or regression behavior is unclear | `writing-tests` | Required companion before or during the relevant TDD/testing slice |
| The issue is a bug, or failures, flakiness, or unexpected behavior appear during implementation or verification | `superpowers:systematic-debugging` | Required before fixes |
| Multiple independent failures or module tasks can proceed without shared state | `superpowers:dispatching-parallel-agents` or `superpowers:subagent-driven-development` | Optional acceleration after plan exists |
| Major slice completes or implementation is ready for handoff | `superpowers:requesting-code-review` for code and test coverage, `code-simplifier` for simplification, plus independent AC review | Required quality gate |
| External or human review feedback arrives before handoff | `superpowers:receiving-code-review` | Required before applying feedback |
| Changed implementation is too complex or recently modified code needs simplification | `code-simplifier` as the independent simplification-review subagent | Required simplification lens before final handoff |
| High-risk or user-requested deep review is needed | `adversarial-review` | Optional hard quality gate before final handoff |
| End-user documentation is required by the issue or changed UI/CLI surface | `authoring-user-guide` | Documentation gate before final implementation note |
| Prompt, agent, or skill behavior changes | `writing-ai-prompts` or `writing-skills`, plus targeted evals | Required for agent-facing artifact quality |

## External Reference Decision

The Matt Pocock skills are MIT licensed and useful as references:

- `request-refactor-plan` emphasizes verifying current behavior, interviewing
  scope, splitting refactors into tiny working steps, documenting testing
  decisions, and writing out-of-scope boundaries.
- `design-an-interface` emphasizes comparing multiple interface shapes and
  evaluating simplicity, depth, caller ergonomics, and misuse risk.

This repository should not paste those full skill contracts into
`implementing-linear-issue` or its eval prompts. Instead, it should keep short
owned references under `skills/implementing-linear-issue/references/` and use
them only when issue evidence calls for refactor or interface design judgment.

## Skill Shape

The main `SKILL.md` should stay short and route to references:

| Reference | Contents |
|---|---|
| `references/discovery-and-routing.md` | Linear issue, codebase, functional spec, design doc, plan discovery, clarification, and handoff ordering |
| `references/implementation-quality.md` | Plan content, TDD, tests, evals, checkpoint commits, and independent subagent review gates |
| `references/linear-update-and-handoff.md` | Linear update traceability, AC status, final note content, clean-worktree handoff, and phase boundary |
| `references/refactor-planning.md` | Major refactor planning inputs and routing |
| `references/interface-design.md` | API/module/component/UI interface design inputs and routing |

This keeps the skill entrypoint scannable while preserving the full workflow
contract for agents that need the detailed rules.

## Workflow Placement

1. Create or reuse the branch and worktree.
2. Read the Linear issue.
3. Stop if the issue has no User Flow label or if
   `docs/functional/<User Flow label>/` is missing.
4. Read the matching functional spec, search the codebase, search related
   `docs/design/` documents, and find any related `docs/plan/` implementation
   plan.
5. Apply hard-gate handoffs in this order: brainstorming for explicit user
   request or unresolved forks, functional spec, design doc, debugging if
   needed.
6. Use `superpowers:writing-plans` to create the implementation plan and post
   it to Linear.
7. Implement in TDD slices, using testing, debugging, documentation, and eval
   handoffs only when their trigger is present.
8. Run code, simplification, test coverage, and acceptance-criteria gates as
   independent subagent reviews before final handoff.
9. Stop before push, PR creation, or `In Review`.

## What This Is Not

- This is not a replacement for `raising-linear-pr` or `closing-linear-issue`.
- This does not make every implementation run every specialist skill.
- This does not allow implementation to proceed when a hard-gate artifact is
  missing and required by the issue evidence.

## Key Source Files

| File | Purpose |
|---|---|
| `skills/implementing-linear-issue/SKILL.md` | Executable workflow contract for implementation-phase Linear work |
| `skills/implementing-linear-issue/references/discovery-and-routing.md` | Discovery, clarification, and pre-implementation handoff details |
| `skills/implementing-linear-issue/references/implementation-quality.md` | Plan, TDD, validation, eval, commit, and independent subagent review details |
| `skills/implementing-linear-issue/references/linear-update-and-handoff.md` | Linear update traceability and handoff boundary details |
| `tests/evals/packages/implementing-linear-issue/skill-implementing-linear-issue.yaml` | Scenario coverage for the implementation skill |
| `tests/evals/prompts/skill-implementing-linear-issue.txt` | Read-only evaluator prompt for scenario-specific workflow behavior |
| `tests/evals/assertions/check-linear-skill-contract.js` | Shared assertion helper for Linear workflow evals |
