---
name: implementing-linear-issue
description: Use when asked to implement, fix, build, or work on an existing Linear issue in this repository, and coding should stop before PR creation
argument-hint: "[issue-id]"
---

# Implementing Linear Issues

## Overview

Implement an existing Linear issue, but stop before PR creation. This skill owns the local implementation phase: branch/worktree setup, issue/code/spec/design discovery, pre-implementation routing, plan approval, TDD implementation, checkpoint commits, local verification, independent subagent quality gates, Linear implementation updates, and a final local commit.

## When to Use

- User asks to implement, fix, build, or work on a Linear issue.
- The issue already exists and needs repository changes.
- Do not use for issue drafting, PR raising, merge, closeout, or cleanup.

## Workflow

### Phase 1: Setup (always runs)

| Step | Requirement |
|---|---|
| 1 | Read the Linear issue to retrieve `gitBranchName` from the issue metadata |
| 2 | Create or checkout the worktree at `../worktrees/<branchName>` using `./scripts/worktree.sh <branchName>` from the repo root |
| 3 | Stop immediately if branch or worktree setup fails |

### Phase 2: Discovery (always runs)

| Step | Check | Output or stop |
|---|---|---|
| 4 | Read Linear description, comments, attachments, labels, and linked documents | Issue context |
| 5 | Identify the Linear team | Team-scoped User Flow rule |
| 6 | For Studio, Roadmap, and Utilities issues, find the issue's User Flow label | Stop if missing |
| 7 | For Studio, Roadmap, and Utilities issues, require exact folder `docs/functional/<User Flow label>/` | Stop if missing |
| 8 | For Studio, Roadmap, and Utilities issues, read the matching functional spec before clarification, planning, or coding | Functional spec path |
| 9 | Search the codebase before user clarification | Relevant files and behavior |
| 10 | Search `docs/design/` by issue key, User Flow label, feature name, domain terms, and linked-document titles | Related design docs, or `not_applicable` |
| 11 | Search `docs/plan/` before creating a new plan | Existing plan path, or new plan needed |

For Studio, Roadmap, and Utilities issues, the User Flow label and functional-spec folder are hard prerequisites. Do not plan, code, or work around either gap. For other teams, do not fail solely because no User Flow label or functional spec exists; record functional spec as `not_applicable`.

| Design-doc situation | Action |
|---|---|
| Referenced related design doc exists | Read it before implementation planning |
| Referenced related design doc is missing | Treat as a context gap and route through design handoff |
| No related design doc after search | Record `not_applicable` in the plan and Linear updates |

### Phase 3: Routing Decision (pick one path)

After discovery, evaluate the conditions below. **The first matching condition wins** — do not evaluate further rows.

| Priority | Condition | Path |
|---|---|---|
| 1 | User explicitly asks to brainstorm, or discovery reveals 2+ viable approaches with no chosen path | → `superpowers:brainstorming` |
| 2 | Functional behavior or product flow is missing, stale, or disputed | → `authoring-functional-spec` |
| 3 | Bug report, unexplained defect, reproduction failure, flaky behavior, regression, or unexpected test result | → `superpowers:systematic-debugging` |
| 4 | Durable architecture, data model, cross-service flow, security, migration, permissions, auditability, API/module boundary, or UI interaction contract is not covered | → `authoring-design-spec` |
| 5 | Issue targets skill or agent content (title/description/labels reference "skill", "agent", or "prompt"; target files under `skills/`, `.opencode/skills/`, `.opencode/agents/`; or work modifies a `SKILL.md`, agent prompt, or skill reference) | → `superpowers:writing-skills` |
| 6 | Issue asks to simplify, untangle, modularize, split, consolidate, or replace existing code without behavior change | → `superpowers:writing-plans` (with refactor checkpoints) |
| 7 | Non-bug implementation, multi-module change, or complex bug fix is ready after hard gates and discovery | → `writing-tests`, then `superpowers:writing-plans` |
| 8 | Simple confirmed single-module bug fix with root cause isolated and fix direction confirmed by user | → implementation directly (skip `writing-plans` and `writing-tests`) |

### Phase 4: Execution (runs after the chosen path completes)

| Step | Requirement |
|---|---|
| 9 | After plan approval, route to `superpowers:subagent-driven-development` if the plan has 2+ tasks with no shared files and no ordering dependency; otherwise implement sequentially |
| 10 | Implement using `references/implementation-quality.md`; use `superpowers:test-driven-development` where the slice needs test-first behavior coverage |
| 11 | Update Linear with source traceability and AC status using `references/linear-update-and-handoff.md` |
| 12 | Run required validation and independent subagent quality gates from `references/implementation-quality.md` |
| 13 | Use `superpowers:receiving-code-review` before applying any quality-gate, human, or external review feedback |
| 14 | Resolve verified feedback, update Linear, create the final implementation commit, and leave the worktree clean |
| 15 | Stop with a clean worktree and hand off to `raising-linear-pr`; do not push or create a PR |

## Required References

| Reference | When to load |
|---|---|
| [`references/implementation-quality.md`](references/implementation-quality.md) | During Phase 4 execution and quality gates |
| [`references/linear-update-and-handoff.md`](references/linear-update-and-handoff.md) | During Phase 4 Linear updates |
| [`references/refactor-planning.md`](references/refactor-planning.md) | When routing path 6 (refactor) is selected |
| [`references/interface-design.md`](references/interface-design.md) | When routing path 4 (design spec) is selected |

## Branch and Worktree

- Always create or reuse the issue branch and worktree before implementation work starts, regardless of issue size.
- Do not make code changes in the main checkout.
- Do not inspect or edit target files from the main checkout once branch/worktree setup begins.
- If branch creation or worktree creation fails, stop immediately and report the exact failing command.

## Linear Status

- Stop on `Done`, `Cancelled`, or `Duplicate`.
- Move `Todo` to `In Progress` and assign to `me`.
- Move `In Review` back to `In Progress` before continuing.

## Completion Gates

Before handoff:

- run changed-area validation and affected skill evals
- run code review through `superpowers:requesting-code-review` as an independent subagent gate
- run simplification review through `code-simplifier` as an independent subagent gate
- run test coverage review through `superpowers:requesting-code-review` with a test-coverage-focused brief as an independent subagent gate
- run acceptance-criteria review as an independent subagent gate
- check off only completed acceptance criteria in the main Linear requirements section
- post a final Linear implementation note that references the functional spec, related design documents, related implementation plan, verification, review outcomes, and remaining risks
- create the final implementation commit and leave the worktree clean

## Stop Conditions

- branch or worktree setup fails
- User Flow label is missing from a Studio, Roadmap, or Utilities Linear issue
- `docs/functional/<User Flow label>/` is missing for a Studio, Roadmap, or Utilities Linear issue
- permanent file deletion or new external dependency is needed
- unresolved architecture, product, security, data, migration, or interface fork
- unresolved error after two attempts
- required local or independent subagent quality gate still fails after retry
- required changes exceed issue scope

## Common Mistakes

- Coding before branch/worktree setup and source discovery are complete.
- Skipping functional spec, design doc, or implementation-plan context.
- Treating bug fixes as normal implementation before root cause and fix direction are confirmed.
- Asking ad hoc clarification questions when brainstorming, design, debugging, or planning handoff applies.
- Pushing, creating a PR, moving to `In Review`, merging, or cleaning up from this phase.

## Boundary

Do not push, create or update a PR, move the issue to `In Review`, merge, close, or remove the worktree. The next skill is `raising-linear-pr`.
