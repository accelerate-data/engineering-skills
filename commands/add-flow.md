---
description: Add a canonical user flow to the Flow Inventory sheet and create its Linear label.
---

# /add-flow

Invoke `managing-user-flow` for the **add** operation.

## Usage

- `/add-flow <canonical-id>` — add the flow with the given canonical ID.
- `/add-flow` — invoke with no ID; the skill will ask.

## What this does

Delegates to `Skill("managing-user-flow")` with operation = add. The skill:

1. Checks `gws auth status` and loads the current sheet and Linear labels.
2. Validates that the canonical ID does not already exist in the sheet or Linear.
3. Collects any missing fields (repo, category, title, status, persona).
4. Shows a Change Preview and waits for confirmation.
5. Appends the new row to Flow Inventory and creates the Linear "User Flow" child label.
