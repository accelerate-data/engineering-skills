# Repo-Level PR Signals

Use these checks when the user asks about one repository's PR backlog or review health.

## Required Metric

| Signal | Default threshold or framing | Command pattern |
| --- | --- | --- |
| PRs pending for more than 48 hours | Treat 48 hours as the default backlog threshold for follow-up, then explain whether the PR is waiting on review, checks, author action, or merge. | `gh pr list --state open --json number,title,createdAt,updatedAt,reviewDecision,isDraft,statusCheckRollup,assignees` |

Old PRs are not automatically stale. The actionable question is why they are still pending after 48 hours.

## Adjacent Checks

| Signal | Why it matters | Where to route next |
| --- | --- | --- |
| Waiting on review | Reviewer follow-up may unblock the branch | `pr-level-actions.md` |
| Approved but not merged | Often indicates missing merge action or failing checks | `pr-level-actions.md` |
| Failing required checks for an extended period | Usually needs author action, rebase, or CI repair before review nudges | `pr-level-actions.md` |
| Stale draft PRs | May need conversion back to active work or closure | `pr-level-actions.md` |
| Missing reviewer or assignee | Process gap; the PR may not be actionable yet | `pr-level-actions.md` |

## Command Patterns

List open PRs with age and state:

```bash
gh pr list --state open --json number,title,createdAt,updatedAt,reviewDecision,isDraft,statusCheckRollup,assignees
```

Inspect one PR in detail:

```bash
gh pr view PR_NUMBER --json number,title,author,createdAt,updatedAt,reviewDecision,isDraft,mergeStateStatus,statusCheckRollup,reviews
```

Filter for open PRs with no reviewer assigned:

```bash
gh pr list --state open --json number,title,reviews,assignees
```

## Interpretation Notes

- "Pending for more than 48 hours" is a follow-up threshold, not an automatic close threshold.
- Differentiate "old but progressing" from "old and blocked." `updatedAt`, review state, and check state matter more than age alone.
- PR backlog can block branch cleanup. If a branch has an open PR, resolve PR disposition first.
