---
description: Retire a canonical user flow in the Flow Inventory sheet and surface its Linear label for archiving.
---

# /retire-flow

Invoke `maintaining-user-flows` for the **retire** operation.

## Usage

- `/retire-flow <canonical-id>` — retire the flow with the given canonical ID.

## What this does

Delegates to `Skill("maintaining-user-flows")` with operation = retire. The skill:

1. Checks `gws auth status` and loads the current sheet and Linear labels.
2. Validates that the canonical ID exists and is not already retired.
3. Checks for open Linear issues tagged with the label and warns if any exist.
4. Shows a Change Preview and waits for confirmation.
5. Updates col H to `retired` in Flow Inventory.
6. Surfaces the Linear label ID for manual archiving in Linear → Settings → Labels.
