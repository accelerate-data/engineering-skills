# Org-Level Signals

Use these signals when the user asks about one GitHub organization rather than one repository.

## Signal Inventory

| Signal | What it usually means | Inspect with | Next step |
| --- | --- | --- | --- |
| Stale repositories | Repo may be abandoned, parked, or waiting for archival | `gh repo list ORG --limit 200 --json name,pushedAt,isArchived` | Route to `repo-level-actions.md` |
| Empty or README-only repositories | Repo may have been created by mistake or never started | `gh repo list ORG --limit 200 --json name,defaultBranchRef` plus repo content checks, or `analyze_repos.py` | Route to `repo-level-actions.md` |
| `scratch*` or `dev*` repos with long inactivity | Likely spike or test repos that can be archived or deleted under the existing cleanup policy | `python3 skills/maintaining-github-repos/scripts/analyze_repos.py --org accelerate-data --dry-run` | Route to `repo-level-actions.md` |
| Archived repositories worth reevaluating | Archived repos can still age into delete candidates under the existing scratch policy | `gh repo list ORG --limit 200 --json name,isArchived,pushedAt` | Route to `repo-level-actions.md` |
| Unusually high branch counts | Repo likely needs repo-level branch review before any org cleanup decision | `gh repo list ORG --limit 200 --json name --jq '.[].name'` plus per-repo branch counts | Route to `repo-level-branch-signals.md` |
| Long-idle open PR inventory | Review or merge backlog may be blocking repo cleanup or branch cleanup | `gh search prs --owner ORG --state open --json number,repository,createdAt,updatedAt` | Route to `repo-level-pr-signals.md` |

## Command Patterns

List core repo inventory:

```bash
gh repo list ORG --limit 200 --json name,isArchived,pushedAt,description
```

Preview repo cleanup candidates with the existing helper:

```bash
python3 skills/maintaining-github-repos/scripts/analyze_repos.py --org accelerate-data --dry-run
```

Review archived repos separately:

```bash
gh repo list ORG --limit 200 --json name,isArchived,pushedAt --jq '.[] | select(.isArchived)'
```

Check org-wide open PR age:

```bash
gh search prs --owner ORG --state open --json repository,number,title,createdAt,updatedAt
```

## Interpretation Notes

- Stale inventory is a signal, not a deletion order. Confirm repo purpose before recommending archive or delete.
- High branch count is usually a repo-level hygiene problem, not an org-level delete signal.
- Long-idle PR queues can explain why stale branches still exist. Review PR state before branch cleanup.
- Use `analyze_repos.py` when the user wants cleanup candidates under the existing repo policy. It is optional for org inventory questions and mandatory only if you need its exact preview/execute safeguard flow.
