---
description: Merge two canonical user flows into one in the Flow Inventory sheet, re-tag all Linear issues, and surface the old labels for archiving.
---

# /merge-flows

Invoke `maintaining-user-flows` for the **merge** operation.

## Usage

- `/merge-flows <id-a> <id-b> <new-id> "<new-title>"` — merge two flows into a new flow.

## What this does

Delegates to `Skill("maintaining-user-flows")` with operation = merge. The skill:

1. Checks `gws auth status` and loads the current sheet and Linear labels.
2. Validates that `<id-a>` and `<id-b>` both exist and are not retired, and that `<new-id>` is unused.
3. Collects metadata for the new flow (repo, category, status, persona) with defaults from `<id-a>`.
4. Lists all Linear issues (open and closed) from both source labels and deduplicates.
5. Shows a Change Preview and waits for confirmation.
6. Retires both source rows, appends the new row, creates the new label, re-tags all issues, and surfaces both old labels for archiving.
