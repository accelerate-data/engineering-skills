---
name: raising-linear-pr
description: Use when implementation is complete and this repository needs the PR-phase workflow - verification, acceptance-criteria checkoff, PR creation, and In Review transition
argument-hint: "[issue-id-or-branch]"
---

# Raising Linear PRs

## Overview

Take completed implementation work across the finish line into review. This skill owns the post-rebase quality-gate rerun, push, PR creation or update, acceptance-criteria checkoff, and moving the issue to `In Review`.

## When to Use

- Local implementation is complete and ready for final verification.
- The issue should move from coding into review.
- Do not use for coding work or merge/close cleanup.

## Quick Reference

| Step | Requirement |
|---|---|
| 1 | Verify the approved implementation, tests, and evals |
| 2 | Update Linear acceptance criteria after verification passes |
| 3 | Push the prepared implementation branch |
| 4 | Create or update the PR |
| 5 | Move the issue to `In Review` |

## Implementation

**Tool contract:** use repo test commands from `repo-map.json`, `git status`, `git push`, `gh pr list`, `gh pr create`, `gh pr edit`, `gh pr view`, `gh pr checks`, `mcp__codex_apps__linear_mcp_server_get_issue`, `save_issue`, and `save_comment`. Retry once on tool failure, then stop and report the exact failing step.

**Branch sync comes first:**

1. Fetch the default branch.
2. Rebase the feature branch onto the default branch before final verification.
3. Resolve only mechanical conflicts directly; escalate semantic conflicts.

**Quality gate order:**

1. Re-run the required automated validation for the changed area.
2. Run the specific promptfoo evals for any changed skill or command.
3. Stop if required checks fail or remain unverified.

**Linear rules:**

- Check off only the acceptance criteria proved by passing verification.
- Preserve the original issue body; update only the implementation snapshot or checklist state.
- Move the issue to `In Review` only after the PR exists.

**Git and PR rules:**

- If the branch is missing the expected implementation commits, stop and hand back to `implementing-linear-issue`.
- If the worktree is dirty at the start of this phase, stop immediately and hand back to `implementing-linear-issue`.
- Push the feature branch.
- Create the PR if none exists; otherwise update the existing PR.
- Include the required `Fixes VU-XXX` lines.
- Report the PR URL and the remaining manual follow-up, if any.

**Boundary rules:**

- No plan mode.
- No merge.
- No close-to-done transition.
- No new implementation commits in this phase.
- Hand off to `closing-linear-issue` for merge and cleanup.

## Common Mistakes

- Running quality gates before rebasing onto the latest default branch.
- Using this phase to clean up uncommitted implementation work.
- Proceeding with push or PR creation from a dirty worktree.
- Treating this as a lightweight push step and skipping verification.
- Moving the issue to `In Review` before the PR exists.
- Checking off acceptance criteria before tests and evals pass.
- Merging the PR from this skill.
