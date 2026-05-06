# Repo-Level Actions

Use this reference after org-level or repo-level signals identify archive or delete candidates.

## Archive Candidates

- Confirm the repo's purpose first. Archive is for inactive repos that should remain discoverable.
- Prefer a preview before any mutation:

```bash
python3 skills/maintaining-github-repos/scripts/analyze_repos.py --org accelerate-data --dry-run
```

- Present the exact archive candidate set before action.
- If the user approves only archive actions from the current preview set, the helper supports:

```bash
python3 skills/maintaining-github-repos/scripts/analyze_repos.py --org accelerate-data --execute --archive-only
```

## Delete Candidates

- Use delete only for exact repos that fit the existing cleanup policy and that the user explicitly approves.
- Always preview first from the same helper:

```bash
python3 skills/maintaining-github-repos/scripts/analyze_repos.py --org accelerate-data --dry-run
```

- Present the exact delete candidate set before action.
- Supported execution scopes are:

```bash
python3 skills/maintaining-github-repos/scripts/analyze_repos.py --org accelerate-data --execute
python3 skills/maintaining-github-repos/scripts/analyze_repos.py --org accelerate-data --execute --delete-only
python3 skills/maintaining-github-repos/scripts/analyze_repos.py --org accelerate-data --execute --delete-repo REPO_NAME
```

## Safeguards

- Preview before mutation is mandatory for repo archive/delete actions.
- Exact-scope confirmation is mandatory before any destructive repo cleanup.
- `--delete-repo` is valid only for repos that appeared in the current proposed `DELETE` list.
- If the user asks for unsupported destructive slicing, stop and restate the supported scopes instead of approximating.
- Repos flagged for manual review stay out of automatic mutation scope.
