---
name: raising-linear-pr
description: Use when implementation is complete and this repository needs the PR-phase workflow - verification, acceptance-criteria completion check, PR creation, and In Review transition
argument-hint: "[issue-id-or-branch]"
---

# Raising Linear PRs

## Overview

Take completed implementation work across the finish line into review. This skill owns the post-rebase quality-gate rerun, acceptance-criteria completion check, push, PR creation or update, and moving the issue to `In Review`.

## When to Use

- Local implementation is complete and ready for final verification.
- The issue should move from coding into review.
- Do not use for coding work or merge/close cleanup.

## Quick Reference

| Step | Requirement |
|---|---|
| 1 | Rebase onto default branch |
| 2 | Check AC status on Linear; check off only already-proven unchecked ACs; stop and hand back to implementation if any AC is unproven or needs code |
| 3 | Run the design conformance gate after ACs pass; record `not_applicable` when no local design document is referenced |
| 4 | Run post-rebase quality gates (automated validation + stale targeted evals) |
| 5 | Push the prepared implementation branch |
| 6 | Create or update the PR |
| 7 | Move the issue to `In Review` |

## Implementation

**Tool contract:** use repo test commands from `repo-map.json`, `git status`, `git push`, `gh pr list`, `gh pr create`, `gh pr edit`, `gh pr view`, `gh pr checks`, and the available Linear MCP tools needed for issue and comment operations in this workflow. Retry once on tool failure, then stop and report the exact failing step.

**Branch sync comes first:**

1. Fetch the default branch.
2. Rebase the feature branch onto the default branch before final verification.
3. Resolve only mechanical conflicts directly; escalate semantic conflicts.

**PR phase gates:** use `references/pr-phase-gates.md` for the AC and design conformance mechanics.

| Gate | Required action |
|---|---|
| AC gate | Verify every AC in the main issue requirements section. Check off only unchecked ACs already proven complete by committed work and evidence. |
| AC blocker | If any AC is incomplete, unproven, blocked, or requires code/test/docs, stop before design conformance, validation, evals, push, PR creation, or `In Review`. |
| Design gate | After ACs pass, inspect issue description, comments, attachments, and linked documents for local design references. |
| No design reference | Record `not_applicable` and empty checked paths, then continue. |
| Design pass | Record `pass` and checked paths, then continue. |
| Design fail | Record `fail`, checked paths, and mismatch evidence; stop before validation, evals, push, or PR creation. |

**Quality gate order:**

1. Re-run the required automated validation for the changed area.
2. Run only the stale, targeted promptfoo evals for changed skills or commands, using the promptfoo DB gate below.
3. Stop if required checks fail or remain unverified.

**Promptfoo eval DB gate:**

Use `references/promptfoo-db-gate.md` for stale-targeted-eval decisions. The main rule: run targeted evals when DB evidence is missing or stale; skip only when the latest fully passing DB run is newer than the latest content-relevant Git change.

**Linear rules:**

- Verify that every acceptance criterion is complete and checked off in the main issue requirements section before automated validation, evals, push, or PR creation.
- Check off only ACs that are already proven by existing committed work and existing evidence.
- If any acceptance criterion remains incomplete, unproven, blocked, or requires code, test, or docs changes, stop and hand back to `implementing-linear-issue`. Do not create a duplicate acceptance-criteria section in this phase.
- When local design references exist, report the checked design document paths and concise `pass`, `fail`, or `not_applicable` design conformance result in the PR-phase evidence.
- Preserve the implementation summary format; do not restate the acceptance criteria in the implementation snapshot.
- Move the issue to `In Review` only after the PR exists.

**Git and PR rules:**

- If the branch is missing the expected implementation commits, stop and hand back to `implementing-linear-issue`.
- If the worktree is dirty at the start of this phase, stop immediately and hand back to `implementing-linear-issue`.
- The dirty-worktree rule is an entry guard that is always part of this PR workflow; a clean worktree means the guard passes, not that the guard is absent.
- Do not edit files, stage changes, or create code, test, docs, AC-fix, or final implementation commits in this phase.
- If validation or evals reveal required implementation changes, stop and hand back to `implementing-linear-issue` instead of fixing and committing here.
- Linear AC checkoff is metadata only; it is not permission to change repository content.
- Design conformance failures are implementation handoff blockers, not permission to change repository content in this phase.
- Push the feature branch.
- Create the PR if none exists; otherwise update the existing PR.
- Include issue-linking lines for the actual issue IDs, for example `Fixes ENG-1023`. This is a generic issue-linking rule: use the real Linear identifiers and any existing repository convention, not a hardcoded workspace-specific placeholder prefix.
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
- Treating AC verification as permission to invent or duplicate acceptance criteria in this phase.
- Continuing to PR creation even though one or more ACs are still incomplete.
- Merging the PR from this skill.

- [`references/pr-phase-gates.md`](references/pr-phase-gates.md) — AC and design conformance gate mechanics
- [`references/promptfoo-db-gate.md`](references/promptfoo-db-gate.md) — stale targeted eval decisions and helper usage
