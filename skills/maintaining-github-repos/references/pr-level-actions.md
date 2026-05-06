# PR-Level Actions

Use this reference after PR signals identify backlog or follow-up candidates.

## Review and Merge Follow-Up

- If a PR has been pending more than 48 hours and is waiting on review, recommend nudging the assigned reviewer or assigning one.
- If a PR is approved but still open, check whether it is waiting on merge policy, failing checks, or author updates.
- If a PR is blocked by failing checks or drift from the base branch, ask the author to rebase, merge the base branch, or repair CI before additional review nudges.

## Draft, Close, or Keep Open

- Convert to draft when the PR is still active work but not review-ready.
- Close only when the work is abandoned, superseded, or intentionally replaced.
- Keep the PR open when it is the authoritative record for a branch that is still under review.

## Branch Cleanup Interaction

- An open PR usually blocks remote branch cleanup.
- A merged PR can make its head branch a branch-cleanup candidate after confirming no retention need.
- A stale draft PR may justify branch cleanup only after the author confirms the work is abandoned.

## Safeguards

- Do not treat "older than 48 hours" as an automatic close rule.
- Distinguish waiting on reviewer, waiting on author, waiting on CI, and waiting on merge policy.
- When closing or converting state, surface the exact PR set first so the user can confirm the intended scope.
