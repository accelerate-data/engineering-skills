# Branch-Level Actions

Use this reference after branch signals identify cleanup candidates inside one repository.

## Confirm Merged Branch Candidates

- Check whether the branch is already merged into the default branch.
- Check whether any open PR still points at that branch.
- Distinguish local cleanup from remote cleanup before proposing commands.

Helpful patterns:

```bash
git branch -r --merged origin/MAIN
gh pr list --state open --search 'head:BRANCH_NAME' --json number,title
```

## Handle Stale Unmerged Branches

- Treat inactivity older than 5 days as a review signal, not as deletion authority.
- Identify the owner, latest commit date, and whether a PR exists.
- If the branch has no PR and no recent activity, recommend asking whether the work is abandoned before deletion.
- If the branch has an open PR, route the next decision through `pr-level-actions.md`.

## Local vs Remote Cleanup

- Local cleanup removes only local refs. Remote cleanup deletes the shared branch for everyone.
- Present the exact local and remote candidate sets separately before any delete recommendation.
- Use `git fetch --all --prune` first so you do not act on stale local tracking data.

## Safeguards

- Never collapse branch review into a blind bulk delete.
- Show the exact candidate list before deletion.
- Call out blockers: open PRs, recent commits, unclear ownership, or long-lived branches with unknown purpose.
