---
name: implementing-linear-issue
description: Use when implementing a Linear issue in this repository after issue creation is complete and coding should stop before PR creation
argument-hint: "[issue-id]"
---

# Implementing Linear Issues

## Overview

Implement the approved issue, but stop before the PR phase. This skill owns mandatory branch/worktree setup, codebase-first clarification, plan approval, isolated implementation work, checkpoint commits, independent-agent quality gates, a final implementation commit, and Linear implementation updates. `raising-linear-pr` owns the post-rebase verification rerun, push, PR creation, and `In Review` transition.

## When to Use

- User asks to implement, fix, build, or work on a Linear issue.
- The issue already exists and needs code changes.
- Do not use for ticket drafting, PR raising, or close/merge work.

## Quick Reference

| Step | Requirement |
|---|---|
| 1 | Create or reuse the issue branch and worktree before any implementation work |
| 2 | Stop immediately if branch or worktree setup fails |
| 3 | Read the Linear issue and search the codebase before asking anything |
| 4 | Resolve every answerable clarification yourself |
| 5 | Ask one question at a time only for true forks |
| 6 | Enter plan mode and show the full plan before coding |
| 7 | Implement in reviewable slices with checkpoint commits |
| 8 | Run tests and independent-agent quality gates, update Linear with implementation and AC status |
| 9 | Create the final implementation commit and hand off before push/PR |

## Implementation

**Tool contract:** use the available Linear MCP tools needed for issue and comment operations in this workflow, `git branch`, `git worktree`, `git status`, `git add <file>`, `git commit`, repo test commands from `repo-map.json`, and independent review agents for the required implementation quality gates. Retry once on tool failure, then stop and report the exact failing step.

**Status setup:**

- Stop on `Done`, `Cancelled`, or `Duplicate`.
- Move `Todo` to `In Progress` and assign to `me`.
- Move `In Review` back to `In Progress` before continuing.

**Branch and worktree setup is mandatory and non-negotiable:**

- Always create or reuse the issue branch and worktree before any implementation work starts, regardless of issue size.
- Do not make code changes in the main checkout.
- Do not inspect or edit target files from the main checkout once branch/worktree setup begins.
- If branch creation fails, stop immediately.
- If worktree creation fails, stop immediately.
- Never continue implementation after a branch or worktree setup failure.
- There is no small-issue exception and no negotiation on this step.

**Clarification protocol:**

1. Create or reuse the issue branch and worktree.
2. If branch or worktree setup fails, stop and report the exact failing command.
3. Read the issue from Linear.
4. Search the codebase before asking the user anything.
5. For each open question:
   - If the code answers it confidently, state the decision and continue.
   - If exactly one viable path exists, state it and continue.
   - If two or more viable paths exist, present them, recommend one, ask one question, and wait.
6. Never batch questions.
7. Never enter plan mode while any gap remains unresolved.

**Plan mode is required.** The implementation plan must include:

- chosen approach and rejected alternatives when relevant
- files or modules expected to change inside the isolated worktree
- commit checkpoints or slice boundaries for multi-step work
- test coverage by layer: unit, integration, eval
- skill or plugin eval coverage affected by the change
- independent quality-gate reviewers to run before handoff: code review, simplification review, test coverage review, AC review
- manual test scope, or the explicit statement `No manual tests required.`

Post the approved plan to Linear before coding. If the user rejects it, revise and re-enter plan mode.

**Implementation rules:**

- Branch and worktree setup happens before any file edits.
- Implementation happens inside the worktree only.
- Stay within issue scope. Pause if work escapes the ticket boundary.
- Read existing tests before changing them.
- Add logging for new behavior per repo policy.
- Update Linear as a living snapshot, with acceptance criteria checked off in the main issue requirements section and progress captured in the implementation comment.
- Work in end-to-end slices that can be reviewed independently.
- After each major slice that leaves the tree green, stage only the relevant files and create a checkpoint commit.
- Do not let large uncommitted work accumulate when a clean checkpoint is available.
- Before handoff, run the required automated validation for the changed area.
- Before handoff, run the specific promptfoo evals for any changed skill or command in this repo.
- Before handoff, dispatch independent review agents so the checks do not reuse the main implementation context.
- Required independent-agent quality gates are:
  - code review
  - simplification review using the `code-simplifier` lens or equivalent simplification-focused prompt
  - test coverage review for changed behavior and regression risk
  - acceptance-criteria review against the current Linear issue state and implementation evidence
- Give each review agent only the context it needs: issue text, plan, commit range or diff, relevant test/eval results, and changed-file context. Do not pass the full implementation session history.
- Resolve review findings before handoff. Retry a failed or inconclusive gate once after fixes or evidence updates, then stop if the gate still fails or remains unverified.
- Treat a coverage review that finds critical paths untested as a failing quality gate.
- Treat an AC review that finds an acceptance criterion unproven, incomplete, or blocked as a failing completion gate for that criterion; do not claim it complete.
- Before handoff, update the main issue requirements section so each completed acceptance criterion is checked off in place.
- Do not create a duplicate acceptance-criteria section in the implementation note.
- Before handoff, update Linear with a final implementation note that includes:
  - what was implemented
  - tests, evals, and manual checks run
  - outcomes of the code review, simplification review, test coverage review, and AC review
- Record AC review conclusions in the implementation note only as needed to explain blockers or follow-up, without restating the full acceptance-criteria list.
- Stop if any required local or independent-agent quality gate fails or remains unverified.
- After all required quality gates pass and the Linear note is posted, create a final implementation commit for the remaining diff.
- Leave the worktree clean before handing off to any downstream skill.
- Output `✅ <completed step>` after each major implementation step.

**Stop conditions:**

- permanent file deletion
- new external dependency
- architecture-impacting fork
- unresolved error after two attempts
- required local quality gate still failing after two attempts
- required changes outside issue scope

**Handoff boundary:**

- Do not push.
- Do not create or update a PR.
- Do not move the issue to `In Review`.
- Do not hand off with uncommitted or unstaged changes still in the worktree.
- Hand off to `raising-linear-pr` after the final implementation commit and local verification pass.
- Report the branch name, worktree path, checkpoint commit SHAs, final implementation commit SHA, clean `git status`, verification run, and any remaining risks.

## Common Mistakes

- Starting changes in the main checkout instead of a dedicated branch and worktree.
- Continuing after branch or worktree setup fails.
- Asking the user questions the codebase could answer.
- Entering plan mode before clarification is complete.
- Waiting until the PR phase to make the first commit.
- Deferring skill evals or changed-area validation until PR time.
- Leaving a dirty worktree for the PR phase to clean up.
- Treating this skill as the PR phase.
- Treating self-review as sufficient when the workflow requires independent review agents.
- Claiming ACs are complete without reviewer evidence.

## Error Recovery

| Situation | Action |
|---|---|
| Worktree exists on wrong branch | Remove and recreate before continuing |
| Branch or worktree creation fails | Stop immediately and report the exact failure |
| Linear API fails | Retry once, then stop with details |
| Tests fail after 3 attempts | Escalate with failure details |
| Plan rejected twice | Ask user for explicit direction |

---

## Exit State

When this skill finishes, the branch and worktree exist, the implementation is complete, checkpoint commits and a final implementation commit exist locally, the worktree is clean, the local verification, repo-local eval gates, and independent-agent quality gates have run, the Linear issue has the completed acceptance criteria checked off in the main requirements section plus an implementation note summarizing work, tests, and reviews, and the issue is still in `In Progress`. The next step is `raising-linear-pr`.
