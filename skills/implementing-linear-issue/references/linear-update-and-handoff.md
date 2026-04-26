# Linear Update and Handoff

Use this reference when posting implementation progress, final implementation notes, and handoff output.

## Linear Updates

Linear updates must include source-traceability paths:

| Traceability item | Value |
|---|---|
| Functional spec | Path from `docs/functional/<User Flow label>/` |
| Design docs | Related `docs/design/` paths, or `not_applicable` |
| Implementation plan | Related `docs/plan/` path |

Update Linear as a living snapshot:

| Update area | Rule |
|---|---|
| Acceptance criteria | Check off completed criteria in the main issue requirements section |
| Duplicate sections | Do not create a duplicate acceptance-criteria section |
| Implementation status | Summarize work, tests, evals, manual checks, and review outcomes |
| AC review conclusions | Include only when needed to explain blockers or follow-up |

## Handoff Boundary

| Before handoff | Requirement |
|---|---|
| Linear | Post final implementation note |
| Git | Create final implementation commit for any remaining diff |
| Worktree | Leave clean |

Do not push, create or update a PR, move the issue to `In Review`, merge, close, or remove the worktree. Hand off to `raising-linear-pr` after the final implementation commit and local verification pass.

| Final status must report |
|---|
| Branch name |
| Worktree path |
| Checkpoint commit SHAs |
| Final implementation commit SHA |
| Clean `git status` |
| Verification run |
| Source traceability paths |
| Remaining risks |
