---
description: Split a canonical user flow into two new flows in the Flow Inventory sheet, re-tag open Linear issues, and surface the old label for archiving.
---

# /split-flow

Invoke `maintaining-user-flows` for the **split** operation.

## Usage

- `/split-flow <source-id> <new-id-1> <new-id-2>` — split one flow into two.

## What this does

Delegates to `Skill("maintaining-user-flows")` with operation = split. The skill:

1. Checks `gws auth status` and loads the current sheet and Linear labels.
2. Validates that `<source-id>` exists and is not retired, and that both new IDs are unused.
3. Collects titles, repo, category, status, and persona for each new flow with defaults from `<source-id>`.
4. Fetches open Linear issues tagged with `<source-id>` and generates an AI recommendation table showing which new flow each issue belongs to.
5. Waits for the user to review and confirm issue assignments.
6. Shows a Change Preview and waits for confirmation.
7. Retires the source row, appends two new rows, creates two new labels, re-tags open issues per confirmed assignments, and surfaces the old label for archiving.
