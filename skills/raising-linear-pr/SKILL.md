---
name: raising-linear-pr
description: Use when implementation is complete and the user asks to raise, create, open, prepare, or update a PR for an existing Linear issue in this repository
argument-hint: "[issue-id-or-branch]"
---

# Raising Linear PRs

## Overview

Move completed implementation work into review. This skill owns final branch sync, PR-phase gates, post-rebase validation, stale targeted eval decisions, push, PR creation or update, and the Linear `In Review` transition.

## When to Use

- Local implementation is complete and ready for final verification.
- The issue should move from coding into review.
- Do not use for coding work, merge, closeout, or cleanup.

## Workflow

| Step | Requirement |
|---|---|
| 1 | Verify the worktree is clean and expected implementation commits exist |
| 2 | Fetch and rebase onto the default branch before final verification |
| 3 | Run the acceptance-criteria gate from `references/pr-phase-gates.md` |
| 4 | Run the design conformance gate from `references/pr-phase-gates.md` |
| 5 | Run changed-area validation and stale targeted eval decisions |
| 6 | Push the prepared branch |
| 7 | Create or update the PR |
| 8 | Move the Linear issue to `In Review` only after the PR exists |

## Hard Gates

- Stop immediately if the worktree is dirty at entry.
- Stop if the branch is missing expected implementation commits.
- Stop before validation, evals, push, PR creation, or `In Review` if any acceptance criterion is incomplete, unproven, blocked, or requires code/test/docs work.
- Stop before validation, evals, push, or PR creation if design conformance fails.
- Stop if validation or stale targeted evals fail or remain unverified.
- Stop instead of editing files, staging changes, or creating implementation commits in this phase.

## PR Phase Gates

Use `references/pr-phase-gates.md` for acceptance-criteria and design-conformance mechanics.

The key rules:

- Check off only unchecked ACs already proven complete by committed work and evidence.
- AC checkoff is Linear metadata only; it is not permission to change repository content.
- Record design conformance as `pass`, `fail`, or `not_applicable` with checked paths.
- Hand back to `implementing-linear-issue` when ACs, design conformance, validation, or evals reveal implementation work.

## Validation and Evals

Run repo validation commands from `repo-map.json` for the changed area.

Use `references/promptfoo-db-gate.md` for stale targeted eval decisions. Do not run the full promptfoo suite by default. Run targeted evals when DB evidence is missing or stale; skip only when the latest fully passing DB run is newer than the latest content-relevant Git change.

## Git and PR Operations

Use `references/git-and-pr.md` for branch sync, push, PR create/update, issue-linking, and boundary rules.

Tool contract: use repo test commands from `repo-map.json`, `git status`, `git push`, `gh pr list`, `gh pr create`, `gh pr edit`, `gh pr view`, `gh pr checks`, and the available Linear MCP tools needed for issue and comment operations. Retry once on tool failure, then stop and report the exact failing step.

## Boundary

- No plan mode.
- No merge.
- No close-to-done transition.
- No new implementation commits.
- Hand off to `closing-linear-issue` for merge and cleanup.

## Common Mistakes

- Pushing or creating a PR from a dirty worktree.
- Editing code, tests, docs, or commits in the PR phase.
- Skipping AC, design, validation, or stale targeted eval gates.
- Moving the issue to `In Review` before the PR exists.
- Duplicating acceptance criteria instead of checking the main Linear requirements section.
- Merging or closing from this phase.

## References

- [`references/pr-phase-gates.md`](references/pr-phase-gates.md) — AC and design conformance gate mechanics
- [`references/promptfoo-db-gate.md`](references/promptfoo-db-gate.md) — stale targeted eval decisions and helper usage
- [`references/git-and-pr.md`](references/git-and-pr.md) — branch sync, push, PR body, and phase boundaries
