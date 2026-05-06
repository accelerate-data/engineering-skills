# Repo-Level Branch Signals

Use these checks when the user asks about one repository's branch inventory or cleanup candidates.

## Required Metrics

| Signal | Default threshold or framing | Command pattern |
| --- | --- | --- |
| Total branch count | Count all remote branches. Exclude the default branch only if the cleanup question is explicitly about candidates. | `gh api repos/OWNER/REPO/branches --paginate --jq '.[].name' \| wc -l` |
| Merged vs remaining branches | Compare branches already merged into the default branch versus branches still unmerged. | `git branch -r --merged origin/MAIN` and `git branch -r --no-merged origin/MAIN` |
| Branches inactive for more than 5 days | Use the last commit timestamp as the baseline inactivity signal. | `for-each-ref` pattern below |

List branch inventory from a local checkout:

```bash
git fetch --all --prune
git branch -r
```

Count merged versus remaining remote branches from a local checkout:

```bash
git branch -r --merged origin/MAIN | sed '/HEAD/d' | wc -l
git branch -r --no-merged origin/MAIN | sed '/HEAD/d' | wc -l
```

Surface branches older than 5 days by last commit date:

```bash
git for-each-ref --sort=committerdate \
  --format='%(refname:short) %(committerdate:iso8601)' refs/remotes/origin
```

Compare the dates against "older than 5 days" before treating them as stale. Staleness is a review signal, not automatic deletion authority.

## Adjacent Checks

| Signal | Why it matters | Where to route next |
| --- | --- | --- |
| Merged PR but branch still present | Usually a low-risk cleanup candidate after confirming no special retention need | `branch-level-actions.md` |
| No upstream or gone upstream | Local tracking branch may be stale or broken | `branch-level-actions.md` |
| No PR attached to the branch | Branch may be an abandoned spike or local-only work stream | `branch-level-actions.md` |
| Very old long-lived unmerged branch | Often needs owner confirmation before deletion | `branch-level-actions.md` |
| Branch count spike relative to normal repo activity | Repo may need process attention, not just cleanup | `repo-level-pr-signals.md` and `branch-level-actions.md` |

## Inspection Patterns

Find branches whose upstream is gone:

```bash
git branch -vv | rg '\\[gone\\]'
```

List open PR heads for cross-checking:

```bash
gh pr list --state open --json number,headRefName,author,updatedAt
```

Check whether a branch already has a merged PR:

```bash
gh pr list --state merged --search 'head:BRANCH_NAME' --json number,mergedAt,baseRefName
```

## Interpretation Notes

- Branch count alone is not a cleanup decision. Pair it with merged state, PR state, and inactivity.
- "Inactive for more than 5 days" means "review this branch," not "delete this branch."
- If a branch has an open or recently active PR, PR state should drive the next action before branch deletion.
