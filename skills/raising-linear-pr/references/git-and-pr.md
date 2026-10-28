# Git and PR

Use this reference after PR-phase gates pass and before pushing or creating/updating the PR.

## Branch Sync

1. Fetch the default branch.
2. Rebase the feature branch onto the default branch before final verification.
3. Resolve only mechanical conflicts directly.
4. Escalate semantic conflicts instead of guessing.

## Entry Guards

| Guard | Rule |
|---|---|
| Dirty worktree | Stop immediately and hand back to `implementing-linear-issue`. |
| Missing implementation commits | Stop and hand back to `implementing-linear-issue`. |
| Validation or eval reveals implementation work | Stop and hand back to `implementing-linear-issue`; do not fix and commit here. |
| Design conformance failure | Stop and hand back to `implementing-linear-issue`; do not change repository content here. |

The dirty-worktree rule is always part of this PR workflow. A clean worktree means the guard passes, not that the guard is absent.

## Push and PR

- Push the feature branch only after AC, design, validation, and eval gates pass.
- Create the PR if none exists; otherwise update the existing PR.
- Include issue-linking lines for the actual Linear issue IDs, for example `Fixes ENG-1023`.
- Use real Linear identifiers and existing repository convention, not a hardcoded workspace-specific placeholder prefix.
- Preserve the implementation summary format; do not restate acceptance criteria in the implementation snapshot.
- Carry the AI PR review result in the PR body: append (or update in place) an `## AI PR Review` section with the subagent's verdict line verbatim (`VERDICT: ...`), the Test Coverage lines, and any user decision on NOT READY findings (fixed in follow-up commits vs rejected with justification). Do this for READY and NOT READY alike — the PR always shows the review outcome.
- Report the PR URL and remaining manual follow-up, if any.
- Move the issue to `In Review` only after the PR exists.

## Prohibited In This Phase

- editing files
- staging changes
- creating code, test, docs, AC-fix, or final implementation commits
- merging the PR
- closing the Linear issue
