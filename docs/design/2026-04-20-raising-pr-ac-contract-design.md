# Raising PR Acceptance Criteria Contract Design

## Goal

Clarify exactly what `raising-linear-pr` may do when Linear acceptance criteria are not already checked, without letting the PR phase become a hidden implementation phase.

## Problem

The current skill says the PR phase checks Linear acceptance criteria before quality gates and may run implementing quality gates if any are unchecked. It also says the worktree must be clean, the implementation commits must already exist, and no new implementation commits are allowed in this phase.

That creates an ambiguity:

- If an AC is complete in committed code but not checked in Linear, the PR phase should be allowed to verify evidence and check it off.
- If an AC is incomplete, unproven, or requires code changes, the PR phase should stop and hand back to implementation.
- The skill must not imply that `raising-linear-pr` can fix code, make implementation commits, or proceed with unproven ACs.

## Contract

### Commit Contract

`raising-linear-pr` starts after implementation is already committed on the feature branch.

The workflow may not create implementation commits. It may proceed only when the worktree is clean at entry. If the worktree is dirty, the skill must stop and hand back to `implementing-linear-issue`.

Allowed commit behavior:

- No new commits during the PR phase for code, tests, docs, or AC fixes.
- No "final implementation commit" from local changes.
- No commit created after running validation or evals.
- If verification reveals required code or test changes, stop and hand back to implementation.

Allowed non-commit side effects:

- Push the already prepared feature branch after gates pass.
- Create or update the PR.
- Update Linear metadata, including checking off ACs that are already proven complete from existing committed work.
- Move the issue to `In Review` after the PR exists.

This means AC checkoff is Linear bookkeeping only. It is not permission to edit files or create a commit in the PR phase.

### AC Contract

The AC gate has three states:

1. **All ACs checked in Linear**
   - Proceed to automated validation and the promptfoo eval DB gate.

2. **ACs complete but unchecked in Linear**
   - Verify completion from existing committed work and existing evidence only.
   - Check off the proven ACs in the main Linear issue requirements section.
   - Continue only if every AC is now checked.
   - Do not edit code or create implementation commits.

3. **Any AC incomplete, unproven, blocked, or requiring code changes**
   - Stop before automated validation, evals, push, or PR creation.
   - Hand back to `implementing-linear-issue`.
   - Do not run this phase as a coding workflow.
   - Do not create a PR with unproven ACs.

## Eval Coverage

Add a second `raising-linear-pr` eval scenario that pressures the ambiguous path:

- one AC is already checked
- one AC is complete in committed work but unchecked in Linear
- one AC is unproven and would require implementation work

The expected behavior is to verify and check off only already-proven ACs, stop on the unproven AC, avoid implementation commits, avoid PR creation, and hand back to implementation.

## Scope

This change updates the skill contract and promptfoo eval coverage. It does not add tooling for AC detection; it clarifies workflow authority and stop conditions.
