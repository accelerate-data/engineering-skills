---
description: Rename a canonical user flow ID and title in the Flow Inventory sheet, re-tag all Linear issues, and surface the old label for archiving.
---

# /rename-flow

Invoke `managing-user-flow` for the **rename** operation.

## Usage

- `/rename-flow <old-id> <new-id>` — rename the canonical ID (title unchanged).
- `/rename-flow <old-id> <new-id> <new-title>` — rename the canonical ID and update the title.

## What this does

Delegates to `Skill("managing-user-flow")` with operation = rename. The skill:

1. Checks `gws auth status` and loads the current sheet and Linear labels.
2. Validates that `<old-id>` exists and is not retired, and that `<new-id>` is unused.
3. Lists all Linear issues (open and closed) tagged with `<old-id>`.
4. Shows a Change Preview and waits for confirmation.
5. Updates cols B and E in the Flow Inventory row.
6. Creates the new Linear label, re-tags all issues, and surfaces the old label for archiving.
