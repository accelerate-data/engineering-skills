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

| Step | Requirement |
|---|---|
| 1 | Read the Linear issue to retrieve `gitBranchName` from the issue metadata |
| 2 | Create or checkout the worktree at `../worktrees/<branchName>` using `./scripts/worktree.sh <branchName>` from the repo root |
| 3 | Stop immediately if branch or worktree setup fails |
| 4 | Read the Linear issue, and for Studio, Roadmap, and Utilities issues require a User Flow label plus matching `docs/functional/<User Flow label>/` folder |
| 5 | Read the functional spec, search the codebase, find related design docs and implementation plans |
| 6 | Apply pre-implementation handoffs from `references/discovery-and-routing.md` |
| 7 | Self-assess complexity after discovery and apply pre-implementation routing from `references/discovery-and-routing.md` |
| 8 | For bugs, use `superpowers:systematic-debugging`, show root cause and proposed fix, then proceed only after confirmation |
| 9 | Before invoking `superpowers:writing-plans`, invoke `writing-tests` to enumerate the complete test scenario set and produce a coverage map; simple confirmed single-module bug fixes that skip `writing-plans` also skip `writing-tests` |
| 10 | Use `superpowers:writing-plans` for non-bug implementation, complex bug fixes, multi-module changes, refactors, or durable design work |
| 11 | After plan approval, route to `superpowers:subagent-driven-development` if the plan has 2+ tasks with no shared files and no ordering dependency; otherwise implement sequentially |
| 12 | Implement using `references/implementation-quality.md`; use `superpowers:test-driven-development` where the slice needs test-first behavior coverage |
| 13 | Update Linear with source traceability and AC status using `references/linear-update-and-handoff.md` |
| 14 | Run required validation and independent subagent quality gates from `references/implementation-quality.md` |
| 15 | Use `superpowers:receiving-code-review` before applying any quality-gate, human, or external review feedback |
| 16 | Resolve verified feedback, update Linear, create the final implementation commit, and leave the worktree clean |
| 17 | Stop with a clean worktree and hand off to `raising-linear-pr`; do not push or create a PR |

## Required References

- [`references/discovery-and-routing.md`](references/discovery-and-routing.md) for codebase/spec/design discovery and handoff rules.
- [`references/implementation-quality.md`](references/implementation-quality.md) for plan content, TDD, tests, commits, evals, and review gates.
- [`references/linear-update-and-handoff.md`](references/linear-update-and-handoff.md) for Linear update content, source traceability, and handoff boundaries.
- [`references/refactor-planning.md`](references/refactor-planning.md) when the issue requires a major refactor.
- [`references/interface-design.md`](references/interface-design.md) when API, module, component, or UI interface design is unclear.

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
