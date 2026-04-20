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
| 3 | Run post-rebase quality gates (automated validation + stale targeted evals) |
| 4 | Push the prepared implementation branch |
| 5 | Create or update the PR |
| 6 | Move the issue to `In Review` |

## Implementation

**Tool contract:** use repo test commands from `repo-map.json`, `git status`, `git push`, `gh pr list`, `gh pr create`, `gh pr edit`, `gh pr view`, `gh pr checks`, and the available Linear MCP tools needed for issue and comment operations in this workflow. Retry once on tool failure, then stop and report the exact failing step.

**Branch sync comes first:**

1. Fetch the default branch.
2. Rebase the feature branch onto the default branch before final verification.
3. Resolve only mechanical conflicts directly; escalate semantic conflicts.

**Acceptance-criteria gate (run after rebase, before quality gates):**

1. Read the Linear issue and classify every acceptance criterion in the main issue requirements section:
   - already checked in Linear;
   - unchecked but already proven complete by existing committed work and existing evidence;
   - incomplete, unproven, blocked, or requiring code, test, or docs changes.
2. If all ACs are already checked, proceed to the quality gate order below.
3. If an AC is unchecked but already proven complete from existing committed work, check it off in Linear as metadata bookkeeping. Do not edit files or create commits.
4. If any AC is incomplete, unproven, blocked, or requires code, test, or docs changes, stop before automated validation, evals, push, or PR creation. Hand back to `implementing-linear-issue` with the specific ACs that still need implementation work.
5. Continue to the quality gate order only when every AC is checked in Linear after this gate.

**Quality gate order:**

1. Re-run the required automated validation for the changed area.
2. Run only the stale, targeted promptfoo evals for changed skills or commands, using the promptfoo DB gate below.
3. Stop if required checks fail or remain unverified.

**Promptfoo eval DB gate:**

Do not run the full promptfoo eval suite by default in this phase. For each candidate eval, decide whether it is stale by comparing promptfoo's latest fully passing DB run with the latest content-relevant Git change for that eval.

1. Build the candidate eval list from changed skills, changed commands, and changed eval infrastructure.
2. Map each candidate eval command to the files that feed it, for example:
   - `eval:raising-linear-pr`: `skills/raising-linear-pr/**`, `tests/evals/packages/raising-linear-pr/**`, `tests/evals/prompts/skill-raising-linear-pr.txt`, and shared assertions it depends on.
   - Shared eval harness changes such as `tests/evals/scripts/promptfoo.sh`, `tests/evals/package.json`, `tests/evals/package-lock.json`, or shared assertion helpers should mark every affected eval stale unless a narrower dependency is clear.
3. For each candidate eval, find the latest content-relevant change with a path-limited Git query against the default-branch merge base. Do not use unrelated branch commits, README changes, merge commits, or rebase-only timestamp churn as stale-eval evidence.
4. Query `tests/evals/.tmp/promptfoo/promptfoo.db` for the latest fully passing run of the matching eval. A fully passing run means every persisted `eval_results` row for that `eval_id` has `success = 1`.
5. Run the targeted eval when:
   - the promptfoo DB is missing, unreadable, or ambiguous;
   - no fully passing DB run exists for that eval;
   - the latest content-relevant Git change is newer than the latest fully passing DB run.
6. Skip the targeted eval only when the latest fully passing DB run is newer than the latest content-relevant Git change.
7. Print the evidence for every eval decision: eval command, mapped inputs, latest content-relevant change time or "no content-relevant change", latest passing DB run time or "none", and run/skip decision.

Example content-relevant change query:

```bash
git log -1 --format=%cI "$(git merge-base HEAD origin/main)"..HEAD -- \
  skills/raising-linear-pr \
  tests/evals/packages/raising-linear-pr \
  tests/evals/prompts/skill-raising-linear-pr.txt \
  tests/evals/assertions/check-linear-skill-contract.js
```

Example latest fully passing promptfoo DB query shape:

```bash
sqlite3 tests/evals/.tmp/promptfoo/promptfoo.db "
  select e.id, e.created_at
  from evals e
  join eval_results r on r.eval_id = e.id
  where e.description = 'Raising-linear-pr skill — verification, AC completion check, PR creation, and In Review transition'
  group by e.id
  having min(r.success) = 1
  order by e.created_at desc
  limit 1;
"
```

**Linear rules:**

- Verify that every acceptance criterion is complete and checked off in the main issue requirements section before automated validation, evals, push, or PR creation.
- Check off only ACs that are already proven by existing committed work and existing evidence.
- If any acceptance criterion remains incomplete, unproven, blocked, or requires code, test, or docs changes, stop and hand back to `implementing-linear-issue`. Do not create a duplicate acceptance-criteria section in this phase.
- Preserve the implementation summary format; do not restate the acceptance criteria in the implementation snapshot.
- Move the issue to `In Review` only after the PR exists.

**Git and PR rules:**

- If the branch is missing the expected implementation commits, stop and hand back to `implementing-linear-issue`.
- If the worktree is dirty at the start of this phase, stop immediately and hand back to `implementing-linear-issue`.
- Do not edit files, stage changes, or create code, test, docs, AC-fix, or final implementation commits in this phase.
- If validation or evals reveal required implementation changes, stop and hand back to `implementing-linear-issue` instead of fixing and committing here.
- Linear AC checkoff is metadata only; it is not permission to change repository content.
- Push the feature branch.
- Create the PR if none exists; otherwise update the existing PR.
- Include the appropriate issue-linking lines for the actual issue IDs, for example `Fixes ENG-1023`, while preserving any workspace-specific linking convention already in use.
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
