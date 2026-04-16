---
name: maintain-github-repos
description: Use when reviewing stale, empty, or scratch repositories in the accelerate-data GitHub organization to decide whether they should be archived or deleted
---

# Maintain GitHub Repos

Use this skill for repository hygiene work in the `accelerate-data` GitHub organization. It analyzes every repository and checks all branches, not just the default branch, before proposing archive or delete actions.

## Rules

| Repo type | Condition | Action |
| --- | --- | --- |
| `scratch*` | No activity in any branch for more than 4 weeks | Archive |
| `scratch*` | Already archived and no activity for more than 8 weeks | Delete |
| non-scratch | Older than 2 weeks and empty or README-only across all branches | Delete |
| non-scratch | No activity in any branch for more than 12 weeks | Archive |

"Empty" means the repo contains no files beyond `README.md`, `README`, `README.txt`, and `.gitignore`.

## Workflow

1. Preview the proposed actions first:

```bash
python3 skills/maintain-github-repos/scripts/analyze_repos.py --org accelerate-data --dry-run
```

2. Show the proposed `DELETE` and `ARCHIVE` groups to the user.

3. Ask whether the user approves the full proposed bulk action set before making changes.

4. Only execute after explicit confirmation:

```bash
python3 skills/maintain-github-repos/scripts/analyze_repos.py --org accelerate-data --execute
```

## Execution

- `--execute` applies every proposed action from the current analysis run.
- Archive actions use GitHub archive operations. Delete actions use GitHub delete operations.
- Do not run `--execute` until the user has reviewed the proposed `DELETE` and `ARCHIVE` lists and confirmed that the full set is safe.
- If the user wants partial approval or exclusions, stop. This skill is only for reviewing and running the full bulk action set safely.

## Threshold Changes

If the user wants different thresholds, update these constants in [analyze_repos.py](/Users/hbanerjee/src/engineering-skills/skills/maintain-github-repos/scripts/analyze_repos.py:25):

```python
SCRATCH_ARCHIVE_WEEKS = 4
SCRATCH_DELETE_WEEKS = 8
NONSCRATCH_EMPTY_WEEKS = 2
NONSCRATCH_ARCHIVE_WEEKS = 12
```

## Dependencies

- `gh` CLI authenticated with access to the `accelerate-data` organization and permission to archive or delete repositories
- Python 3

## Notes

- Archived non-scratch repositories are left alone unless the user explicitly asks for a broader cleanup policy.
- `scratch_*` and `scratch-*` are treated the same way.
- The script retries GraphQL calls to tolerate transient GitHub API failures.
