# Git and PR Conventions

Use these conventions unless the target repository explicitly defines different PR or worktree rules.

## PR Title Format

- Title: `<issue-id>: short description`
- Example: `ABC-530: add status badge to issue card`

## PR Link Format

- Body should include `Fixes <issue-id>`
- For multi-issue PRs, put each issue on its own line

Example:

```markdown
Fixes ABC-530
Fixes ABC-531
```

## PR Body Template

```markdown
Fixes <issue-id>

<!-- If the PR covers child issues, list EACH on its own line: -->
<!-- Fixes ABC-530 -->
<!-- Fixes ABC-531 -->
<!-- NEVER group as "Fixes ABC-530/531/532" — each must be a separate line. -->

## Summary
[2-3 sentences from implementation status]

## Changes
- [Bullet list of what changed]

## Test plan
- [x] [Automated tests that passed, with counts]
- [ ] [Manual verification step 1]
- [ ] [Manual verification step 2]

## Acceptance Criteria
- [x] [AC 1]
- [x] [AC 2]
```

## Test Plan Guidelines

The test plan section is **checked during `/close-issue`** — unchecked items block the merge.

- **Automated tests**: mark `[x]` immediately after tests pass. Include counts.
- **Manual tests**: leave `[ ]` unchecked. The user checks these off after manual testing.
- Write manual test items as concrete steps (action + expected result).
- Cover every user-visible behavior change, not internals.

## Worktree Preservation

**Do NOT remove the worktree.** The user tests manually on it. Include the worktree path in the final status report.

If the repository uses a dedicated `../worktrees/<branch-name>` convention, preserve that exact path in the final status report.
