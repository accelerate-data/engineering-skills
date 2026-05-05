# Rename Operation Reference

Use this reference when `managing-user-flow` is invoked with `operation=rename`. Work through each section in order. Do not skip ahead to execution before validation and the Change Preview are complete.

## §1 Validation

Perform all checks below before showing the Change Preview. A failure in any check aborts the operation immediately.

### §1.1 Phase 0 prerequisite

The auth check (sheet-ops.md §2) and full-sheet read (sheet-ops.md §3) must already be complete and cached in working memory before validation begins.

### §1.2 Old ID existence — sheet

Using the cached CSV, run the canonical-ID lookup (sheet-ops.md §4) against column B
(exact match on `<old-id>`). If no matching row is found, abort with:

```text
Canonical ID '<old-id>' not found in Flow Inventory sheet.
```

### §1.3 Status pre-check

From the matched row, read column H. If the value is `retired`, abort with:

```text
Cannot rename a retired flow. Use add to create a new flow instead.
```

### §1.4 New ID uniqueness — sheet

Using the cached CSV, run the canonical-ID lookup (sheet-ops.md §4) against column B for `<new-id>`. If a matching row is found, abort with:

```text
Canonical ID '<new-id>' already exists in the sheet.
```

### §1.5 New ID uniqueness — Linear

Search the Phase 0 cached label list for a label named exactly `<new-id>` under the "User Flow" parent. If a match is found, abort with:

```text
Linear label '<new-id>' already exists under User Flow.
```

### §1.6 Title default

If `<new-title>` was not provided by the user, read the existing value from column E of the matched row and use it as `<new-title>`. Note to the user:

> No new title provided. Defaulting to existing title: `<existing-title>`.

## §2 List All Issues Tagged with Old Label

Use `mcp__linear__list_issues` with:

- `label`: `<old-id>`
- `limit`: 250
- No state filter — include ALL issues (open and closed)

Validate the tool response before proceeding. Count the total results as
`<issue-count>`. All issues will be re-tagged in §6, including closed ones.

If the call returns 250 results, note:

> The query returned 250 issues (the maximum). There may be additional issues beyond
> this limit. Proceeding with the batch returned.

## §3 Change Preview

After all §1 checks pass and §2 completes, show the block below exactly as written and wait for the user to respond.

```text
Change Preview — rename
Sheet: update Flow Inventory row <row>
  B: <new-id>  (was: <old-id>)
  E: <new-title>  (was: <old-title>)
Linear:
  1. Create label "<new-id>" under "User Flow" (color #5e6ad2)
  2. Re-tag <issue-count> issues from "<old-id>" → "<new-id>"  (open + closed)
  3. Archive label "<old-id>"  ← manual step

Confirm? (yes / confirm / abort)
```

Notes:

- `<row>` is the sheet row number from the §1.2 lookup (CSV data index + 2;
  see sheet-ops.md §4).
- `<old-title>` is the value read from column E of the matched row in §1.2.
- `<new-title>` is the value resolved in §1.6.
- `<issue-count>` is the count from §2.

If the user responds with anything other than "yes" or "confirm", do not write any changes and report:

```text
Operation cancelled. No changes were made.
```

Do not proceed to §4 unless the user explicitly responds "yes" or "confirm".

## §4 Execute — Update Sheet

### §4.1 Schema guard

Before writing, verify the cached CSV has exactly 13 columns (A–M). If the count differs, abort with:

```text
Sheet schema has drifted. Expected 13 columns (A–M), got <col-count>.
```

(See sheet-ops.md §7.)

### §4.2 Write column B

Use the sheet-ops.md §5 cell update pattern:

- Range: `Flow Inventory!B<row>`
- Value: `<new-id>`

Validate the tool response. If the call fails, abort and report the error. Do not proceed to §4.3 or any later section.

### §4.3 Write column E

Use the sheet-ops.md §5 cell update pattern:

- Range: `Flow Inventory!E<row>`
- Value: `<new-title>`

Validate the tool response. If the call fails, abort and report the error. Do not proceed to §5. Note that column B has already been updated — report this partial state to the user.

## §5 Execute — Create New Linear Label

Use `mcp__linear__create_issue_label` with:

- `name`: `<new-id>`
- parent label name: `User Flow`
- `color`: `#5e6ad2`

Verify the response contains a valid label name before proceeding. If the call fails, abort and report the error. Do not proceed to §6. Note that the sheet has already been updated (cols B and E) — report this partial state to the user.

## §6 Execute — Re-tag All Issues

For each issue returned in §2, use `mcp__linear__save_issue` to:

- Add label `<new-id>`
- Remove label `<old-id>`

Process all issues sequentially. Report progress as you go:

> Re-tagged `<completed-count>`/`<issue-count>` issues…

If any individual issue update fails: log the issue identifier and title, continue with the remaining issues, and report all failures at the end. Do not abort the batch on a single failure.

Log each failure as: `<identifier>: <title> — error: <message>`

## §7 Surface Old Label for Archiving

Using the Phase 0 cached label list, find the label named `<old-id>` under
"User Flow" and read its ID as `<label-id>`. Present to the user:

Note: the no-re-fetch rule in sheet-ops.md §7 applies to the sheet only. Re-fetching Linear labels via `mcp__linear__list_issue_labels` is safe if the session has been long-running.

> Linear label ready to archive: **`<old-id>`** (ID: `<label-id>`). Go to
> Linear → Settings → Labels, find the label, and archive it. The MCP has no
> archive call — this step is always manual.

## §8 Confirm Outputs

After §4–§7 complete, report:

> Renamed `<old-id>` → `<new-id>` in sheet (cols B and E updated).
> `<issue-count>` issues re-tagged to `<new-id>`. [If any failures: `<fail-count>`
> issues failed re-tagging — see list above.] Archive old label `<old-id>`
> (ID: `<label-id>`) manually in Linear → Settings → Labels.

If `<issue-count>` equals 250: append to the report — "Warning: the issue query was capped at 250. Issues beyond this limit still carry the `<old-id>` label — verify manually in Linear."
