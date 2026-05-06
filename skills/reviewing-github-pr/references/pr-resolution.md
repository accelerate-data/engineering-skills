# PR Resolution

Start from the PR, not from Linear.

Accepted entry forms:

- full GitHub PR URL
- PR number in the current repo
- branch name when it maps unambiguously to an open PR

Resolve the repo, PR number, head branch, and base branch from the PR metadata, then create a temporary sibling review worktree from the PR branch.

Gather GitHub facts needed for the rest of the workflow:

- PR title and body
- changed files and diff summary
- current review state
- current check state when available

If the worktree cannot be created cleanly, stop and report the exact failure.
