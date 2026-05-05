# Add Operation Reference

Use this reference when `managing-user-flow` is invoked with `operation=add`. Work through each section in order. Do not skip ahead to execution before validation and the Change Preview are complete.

## §1 Validation

Perform all checks below before showing the Change Preview. A failure in any check aborts the operation immediately.

### §1.1 Phase 0 prerequisite

The auth check (sheet-ops.md §2) and full-sheet read (sheet-ops.md §3) must already be complete and cached in working memory before validation begins.

### §1.2 Canonical-ID uniqueness — sheet

Using the cached CSV, run the canonical-ID lookup (sheet-ops.md §4) against column B.
If a matching row is found, abort with:

```text
Canonical ID `<id>` already exists in Flow Inventory. Use rename or retire instead.
```

### §1.3 Canonical-ID uniqueness — Linear

Search the Phase 0 cached label list for a label named exactly `<canonical-id>` under the "User Flow" parent. If a match is found, abort with:

```text
Linear label `<id>` already exists under User Flow.
```

### §1.4 Required fields

Confirm all of the following fields are present in the invocation:

- `canonical-id`
- `repo`
- `category`
- `title`
- `status`
- `persona`

If any field is missing, ask for it before proceeding. Do not show the Change Preview until every field is supplied.

If the user does not supply the missing field, abort with:

```text
Operation cancelled. Required field(s) not provided.
```

### §1.5 Status value

Confirm `status` is one of:

- `not-started`
- `early`
- `feature-complete`
- `working`
- `parked`
- `retired`

If the value does not match, abort with:

```text
Invalid status `<value>`. Must be one of: not-started, early, feature-complete, working, parked, retired.
```

## §2 Change Preview

After all §1 checks pass, show the block below exactly as written and wait for the user to respond.

```text
Change Preview — add
Sheet: append row to Flow Inventory
  B: <canonical-id>
  C: <repo>
  D: <category>
  E: <title>
  H: <status>
  K: <persona>
  M: <canonical-id>   ← written after label is created in §3
Linear: create label "<canonical-id>" under "User Flow" (color #5e6ad2)

Confirm? (yes / confirm / abort)
```

If the user responds with anything other than "yes" or "confirm", do not write any changes and report:

```text
Operation cancelled. No changes were made.
```

Do not proceed to §3 unless the user explicitly responds "yes" or "confirm".

## §3 Execute — Create Linear Label

Use `mcp__linear__create_issue_label` with the following parameters:

- `name`: `<canonical-id>`
- parent label name: `User Flow`
- `color`: `#5e6ad2`

Capture the created label's name from the response (used in the §5 confirmation message). The label's internal ID is not needed by this operation.

If the response does not contain a valid label name, treat it as a failure: abort and report the error. Do not proceed to §4.

If the tool call fails, abort and report the error. Do not proceed to §4.

## §4 Execute — Append Sheet Row

Before populating values, verify the cached CSV has exactly 13 columns (A–M). If the count differs, abort with:

```text
Sheet schema has drifted. Expected 13 columns (A–M), got <N>.
```

(See sheet-ops.md §7.)

Use the sheet-ops.md §6 append pattern. Populate values as follows:

| Column | Value |
|---|---|
| A (`#`) | Count of data rows in cached CSV + 1 |
| B | `<canonical-id>` |
| C | `<repo>` |
| D | `<category>` |
| E | `<title>` |
| F | empty string |
| G | empty string |
| H | `<status>` |
| I | empty string |
| J | empty string |
| K | `<persona>` |
| L | empty string — **never write a formula here** (see sheet-ops.md §7) |
| M | `<canonical-id>` — the canonical-id string, now that the label exists |

Compute col A by counting the rows in the cached CSV result and adding 1. Example: if the cached CSV has 15 data rows, set col A to 16.

If the append call fails, report the error. The Linear label was already created; note this in the error message so the user can reconcile manually if needed.

## §5 Confirm Outputs

After both §3 and §4 complete successfully, report:

```text
Added `<canonical-id>` to Flow Inventory (row appended) and created Linear label `<canonical-id>`.
```
