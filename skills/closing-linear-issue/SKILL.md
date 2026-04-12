---
name: closing-linear-issue
description: Use when a Linear issue already has a review-ready PR and this repository needs the merge, close, and cleanup phase
argument-hint: "[issue-id-or-pr]"
---

# Closing Linear Issues

## Overview

Finish the last mile after review: verify the PR can merge, merge it, move linked issues to `Done`, and clean up branches and worktrees safely.

## When to Use

- A PR already exists for the issue.
- Review is complete and the issue is ready to close.
- Do not use for coding work or PR creation.

## Quick Reference

| Step | Requirement |
|---|---|
| 1 | Locate the PR and verify merge readiness |
| 2 | Respect required checks and branch protection |
| 3 | Merge the PR |
| 4 | Move linked issues to `Done` |
| 5 | Remove worktree and branches safely |

## Implementation

**Tool contract:** use `mcp__codex_apps__linear_mcp_server_get_issue`, `list_issues`, `list_comments`, `save_issue`, `save_comment`, `gh pr list`, `gh pr view`, `gh pr checks`, `gh pr merge`, `git worktree remove`, `git branch -D`, `git push origin --delete`, and `git pull`. Retry once on failure, then stop and report the exact step.

**Branch sync comes first:**

1. Fetch the default branch.
2. Rebase the feature branch onto the latest default branch before merge.
3. Resolve only mechanical conflicts directly; escalate semantic conflicts.

**Readiness rules:**

- If no PR exists, stop and direct the user back to `raising-linear-pr`.
- If the worktree is dirty at the start of this phase, stop immediately and direct the user back to `implementing-linear-issue`.
- If required checks fail, stop and report them.
- If the PR test plan is incomplete, stop and report the gap.
- If semantic merge conflicts appear, escalate to the user.

**Merge and close rules:**

- Prefer squash merge unless the repo policy or PR requires otherwise.
- Capture the merge commit SHA.
- Move the primary issue and any linked `Fixes` or `Closes` issues to `Done`.
- Add a closing Linear comment with the PR URL and merge SHA.

**Cleanup rules:**

- Treat already-removed worktrees or branches as success.
- Keep the pre-merge safety rule strict: do not merge from a dirty worktree.
- After the PR is merged and the remote branch is deleted, treat the local feature worktree as disposable.
- During post-merge cleanup, auto-remove ignored and untracked local artifacts before removing the worktree.
- If tracked modifications still exist during post-merge cleanup, stop and report them explicitly instead of discarding them.
- Clean up the worktree, local branch, remote branch, and refresh the main branch.

**Boundary rules:**

- No plan mode.
- No new code changes except mechanical conflict resolution.
- No new PR creation.

## Common Mistakes

- Trying to merge before rebasing onto the latest default branch.
- Trying to close the issue before a PR exists.
- Proceeding with merge or cleanup from a dirty worktree.
- Ignoring required checks or an incomplete PR test plan.
- Silently discarding tracked changes during post-merge cleanup.
- Re-running the whole implementation flow instead of just merging and closing.
