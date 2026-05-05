# Merge Operation Reference

Use this reference when `managing-user-flow` is invoked with `operation=merge`. Work through each section in order. Do not skip ahead to execution before validation and the Change Preview are complete.

## §1 Validation

Perform all checks below before showing the Change Preview. A failure in any check aborts the operation immediately.

### §1.1 Phase 0 prerequisite

The auth check (sheet-ops.md §2), full-sheet read (sheet-ops.md §3), and Linear label list must already be complete and cached in working memory before validation begins.

### §1.2 Source ID existence — id-a

Using the cached CSV, run the canonical-ID lookup (sheet-ops.md §4) against column B
(exact match on `<id-a>`). If no matching row is found, abort with:

```text
Canonical ID '<id-a>' not found in Flow Inventory sheet.
```

### §1.3 Source ID existence — id-b

Using the cached CSV, run the canonical-ID lookup (sheet-ops.md §4) against column B
(exact match on `<id-b>`). If no matching row is found, abort with:

```text
Canonical ID '<id-b>' not found in Flow Inventory sheet.
```

### §1.4 Retired status pre-check — id-a

From the matched row for `<id-a>`, read column H. If the value is `retired`, abort with:

```text
'<id-a>' is already retired. Cannot merge a retired flow.
```

### §1.5 Retired status pre-check — id-b

From the matched row for `<id-b>`, read column H. If the value is `retired`, abort with:

```text
'<id-b>' is already retired. Cannot merge a retired flow.
```

### §1.6 New ID uniqueness — sheet

Using the cached CSV, run the canonical-ID lookup (sheet-ops.md §4) against column B for `<new-id>`. If a matching row is found, abort with:

```text
Canonical ID '<new-id>' already exists in the sheet.
```

### §1.7 New ID uniqueness — Linear

Search the Phase 0 cached label list for a label named exactly `<new-id>` under the "User Flow" parent. If a match is found, abort with:

```text
Linear label '<new-id>' already exists under User Flow.
```

### §1.8 New title

If `<new-title>` was not provided by the user, ask for it before proceeding. Do not show the Change Preview until the title is supplied.

### §1.9 New flow metadata

Ask the user to provide values for the new flow's:

- `repo`
- `category`
- `status`
- `persona`

Suggest the values from `<id-a>`'s row as defaults. Wait for confirmation before proceeding.

After the user supplies the `status` value, validate it is one of: `not-started`, `early`, `feature-complete`, `working`, `parked`, `retired`. If the value is not in this list, abort with:

```text
Invalid status '<value>'. Must be one of: not-started, early, feature-complete, working, parked, retired.
```

## §2 List Issues from Both Source Labels

Use `mcp__linear__list_issues` separately for each source label.

**Query A:** `label` = `<id-a>`, `limit` = 250, no state filter (all issues, open and closed).

**Query B:** `label` = `<id-b>`, `limit` = 250, no state filter (all issues, open and closed).

Validate each tool response before proceeding.

Deduplicate by issue ID — an issue may carry both labels. The total is the count of the union of both result sets. Record this as `<issue-count>`.

If either query returns 250 results, note:

> The query for `<label-id>` returned 250 issues (the maximum). There may be
> additional issues beyond this limit. Proceeding with the batch returned.
>
> Each query is independently capped. Issues that appear only in one label's tail
> (beyond position 250) are not included in the union, regardless of the other
> query's result.

## §3 Change Preview

After all §1 checks pass and §2 completes, show the block below exactly as written and wait for the user to respond.

```text
Change Preview — merge <id-a> + <id-b> → <new-id>
Sheet:
  Retire row <row-a>  (H: retired, was: <status-a>)
  Retire row <row-b>  (H: retired, was: <status-b>)
  Append new row: <new-id> | <repo> | <category> | <new-title> | <status> | <persona>
Linear:
  1. Create label "<new-id>" under "User Flow" (color #5e6ad2)
  2. Re-tag <issue-count> issues from "<id-a>" and "<id-b>" → "<new-id>"  (open + closed)
  3. Archive labels "<id-a>" and "<id-b>"  ← manual step

Confirm? (yes / confirm / abort)
```

Notes:

- `<row-a>` is the sheet row number for `<id-a>` (CSV data index + 2; see sheet-ops.md §4).
- `<row-b>` is the sheet row number for `<id-b>` (CSV data index + 2; see sheet-ops.md §4).
- `<status-a>` is the value read from column H of `<id-a>`'s matched row in §1.4.
- `<status-b>` is the value read from column H of `<id-b>`'s matched row in §1.5.
- `<issue-count>` is the deduplicated union count from §2.

If the user responds with anything other than "yes" or "confirm", do not write any changes and report:

```text
Operation cancelled. No changes were made.
```

Do not proceed to §4 unless the user explicitly responds "yes" or "confirm".

## §4 Execute — Retire Source Rows

### §4.1 Schema guard

Before writing, verify the cached CSV has exactly 13 columns (A–M). If the count differs, abort with:

```text
Sheet schema has drifted. Expected 13 columns (A–M), got <col-count>.
```

(See sheet-ops.md §7.)

### §4.2 Retire id-a

Use the sheet-ops.md §5 cell update pattern:

- Range: `Flow Inventory!H<row-a>`
- Value: `retired`

Validate the tool response. If the call fails, abort and report the error. Do not proceed to §4.3 or any later section.

### §4.3 Retire id-b

Use the sheet-ops.md §5 cell update pattern:

- Range: `Flow Inventory!H<row-b>`
- Value: `retired`

Validate the tool response. If the call fails, abort and report the error. Note that `<id-a>`'s row has already been retired — report this partial state to the user before stopping.

## §5 Execute — Append New Row

Use the sheet-ops.md §6 append pattern. Compute col A by counting the rows in the cached CSV and adding 1. The cached count reflects the original row total before the two retirements in §4 (the cached CSV is not re-fetched); add 1 to get the new row number.

Populate values as follows:

| Column | Value |
|---|---|
| A (`#`) | Count of data rows in cached CSV + 1 |
| B | `<new-id>` |
| C | `<repo>` |
| D | `<category>` |
| E | `<new-title>` |
| F | empty string |
| G | empty string |
| H | `<status>` |
| I | empty string |
| J | empty string |
| K | `<persona>` |
| L | empty string — **never write a formula here** (see sheet-ops.md §7) |
| M | `<new-id>` — the canonical-id string (matches the value used in add.md; col M stores the canonical-id string, not a label object ID) |

Verify the append succeeds before proceeding to §6. If the call fails, abort and report the error. Note that both source rows have already been retired — report this partial state to the user.

## §6 Execute — Create Label and Re-tag Issues

### §6.1 Create new label

Use `mcp__linear__create_issue_label` with:

- `name`: `<new-id>`
- parent label name: `User Flow`
- `color`: `#5e6ad2`

Verify the response contains a valid label name before proceeding. If the call fails, abort and report the error. Note the partial state: both source rows are retired and the new sheet row is appended, but the label was not created.

### §6.2 Re-tag all issues

For each issue in the deduplicated union from §2, use
`mcp__linear__save_issue` to:

- Add label `<new-id>`
- Remove labels `<id-a>` AND `<id-b>`

Process all issues sequentially. Report progress as you go:

> Re-tagged `<completed-count>`/`<issue-count>` issues…

If any individual issue update fails: log the failure, continue with the remaining issues, and report all failures at the end. Do not abort the batch on a single failure.

Log each failure as: `<identifier>: <title> — error: <message>`

### §6.3 Cap warning

If either query in §2 returned 250 results, note after re-tagging:

> Warning: one or both issue queries were capped at 250. Additional issues may still
> carry the old labels. Verify manually in Linear.

## §7 Surface Source Labels for Archiving

Before surfacing the manual archive step, update the cached state in memory:

- set col H = `retired` in the cached rows for `<id-a>` and `<id-b>`
- append the new 13-column row for `<new-id>` to the cached sheet data
- add `<new-id>` to the cached Linear label list
- update cached issue-label assignments so re-tagged issues drop `<id-a>` and `<id-b>` and gain `<new-id>`

Do not re-fetch the sheet for verification; use this updated cached state instead.

Find the label IDs for `<id-a>` and `<id-b>` from the Phase 0 cached label list.

Note: the no-re-fetch rule in sheet-ops.md §7 applies to the sheet only. Re-fetching Linear labels via `mcp__linear__list_issue_labels` is safe if the session has been long-running.

Present both labels to the user:

> Linear labels ready to archive:
>
> - **`<id-a>`** (ID: `<label-id-a>`) — Go to Linear → Settings → Labels and archive it
> - **`<id-b>`** (ID: `<label-id-b>`) — Go to Linear → Settings → Labels and archive it
>
> The MCP has no archive call — this step is always manual.

## §8 Confirm Outputs

After §4–§7 complete, report:

> Merged `<id-a>` + `<id-b>` → `<new-id>`. Both source rows retired. New row
> appended. `<issue-count>` issues re-tagged. [If any failures: `<fail-count>` issues
> failed re-tagging — see list above.] [If cap hit: Warning: one or both issue queries
> were capped at 250 — additional issues may still carry old labels. Verify manually.]
> Archive source labels `<id-a>` and `<id-b>` manually in Linear → Settings → Labels.
