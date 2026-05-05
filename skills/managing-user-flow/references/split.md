# Split Operation Reference

Use this reference when `managing-user-flow` is invoked with `operation=split`.
Work through each section in order. Do not skip ahead to execution before validation,
the AI recommendation table, and the Change Preview are complete.

## §1 Validation

Perform all checks below before showing the AI recommendation table or Change Preview.
A failure in any check aborts the operation immediately.

### §1.1 Phase 0 prerequisite

The auth check (sheet-ops.md §2), full-sheet read (sheet-ops.md §3), and Linear label
list must already be complete and cached in working memory before validation begins.

### §1.2 Source ID existence

Using the cached CSV, run the canonical-ID lookup (sheet-ops.md §4) against column B
(exact match on `<source-id>`). If no matching row is found, abort with:

```text
Canonical ID '<source-id>' not found in Flow Inventory sheet.
```

### §1.3 Retired status pre-check

From the matched row for `<source-id>`, read column H. If the value is `retired`,
abort with:

```text
'<source-id>' is already retired. Cannot split a retired flow.
```

### §1.4 New ID uniqueness — new-id-1 in sheet

Using the cached CSV, run the canonical-ID lookup (sheet-ops.md §4) against column B
for `<new-id-1>`. If a matching row is found, abort with:

```text
Canonical ID '<new-id-1>' already exists in the sheet.
```

### §1.5 New ID uniqueness — new-id-2 in sheet

Using the cached CSV, run the canonical-ID lookup (sheet-ops.md §4) against column B
for `<new-id-2>`. If a matching row is found, abort with:

```text
Canonical ID '<new-id-2>' already exists in the sheet.
```

### §1.6 New ID uniqueness — new-id-1 in Linear

Search the Phase 0 cached label list for a label named exactly `<new-id-1>` under
the "User Flow" parent. If a match is found, abort with:

```text
Linear label '<new-id-1>' already exists under User Flow.
```

### §1.7 New ID uniqueness — new-id-2 in Linear

Search the Phase 0 cached label list for a label named exactly `<new-id-2>` under
the "User Flow" parent. If a match is found, abort with:

```text
Linear label '<new-id-2>' already exists under User Flow.
```

### §1.8 New titles

If the title for either `<new-id-1>` or `<new-id-2>` was not provided by the user,
ask for the missing title(s) before proceeding. Do not show the recommendation table
or Change Preview until both titles are supplied.

### §1.9 New flow metadata

Ask the user to provide values for each new flow separately:

- `repo`
- `category`
- `status`
- `persona`

Suggest the values from `<source-id>`'s row as defaults for both. Wait for
confirmation before proceeding.

After the user supplies each `status` value, validate it is one of: `not-started`,
`early`, `feature-complete`, `working`, `parked`, `retired`. If a value is not
in this list, abort with:

```text
Invalid status '<value>'. Must be one of: not-started, early, feature-complete, working, parked, retired.
```

If the user supplies `retired` as the status for a new flow, abort with:

```text
A newly created flow cannot have status retired. Choose a different status.
```

Validate the status for each new flow independently. Apply this check to both
`<status-1>` and `<status-2>` before proceeding.

## §2 Fetch Open Issues from Source Label

Use `mcp__claude_ai_Linear__list_issues` with:

- `label`: `<source-id>`
- Filter to open states only: omit the state filter and manually exclude issues whose
  state type is `completed`, `cancelled`, or `duplicate`.
- `limit`: 250

Validate the tool response before proceeding.

Record the count of open (non-closed) issues as `<open-issue-count>`.

If the query returns 250 results, note:

> The query for `<source-id>` returned 250 issues (the maximum). There may be
> additional open issues beyond this limit. Proceeding with the batch returned.

Note: closed issues (`completed`, `cancelled`, `duplicate`) are intentionally
excluded. They remain tagged with the `<source-id>` (retired) label and are not
re-tagged.

## §3 AI Recommendation Table

For each open issue, review the identifier, title, and description excerpt (if
available), then recommend which of the two new flows it belongs to with a one-line
rationale. Format as a table:

```text
| Issue      | Title                       | Recommended flow | Rationale                          |
|------------|-----------------------------|------------------|------------------------------------|
| VD-1234    | Add source connection setup | <new-id-1>       | Matches ingestion setup scope      |
| VD-5678    | Configure alert thresholds  | <new-id-2>       | Relates to alerting behaviour      |
```

After the table, ask:

> Review the recommendations above. Adjust any assignments, then confirm by
> responding "yes" or "confirm". Or type "abort" to cancel.

If the user provides assignment adjustments (e.g., "move VD-1234 to `<new-id-2>`"),
update the recorded assignments, re-display the corrected table, and ask for
confirmation again. Only accept "yes" or "confirm" as final confirmation. Continue
accepting adjustments until the user confirms or aborts.

If the user responds "abort", or anything other than "yes" or "confirm", do not
proceed. Report:

```text
Operation cancelled. No changes were made.
```

Record the final confirmed assignment for each issue: which of `<new-id-1>` or
`<new-id-2>` the issue is assigned to. Use these assignments in §8.

Also maintain two grouped lists — one of issue identifiers assigned to `<new-id-1>`
and one assigned to `<new-id-2>` — for use in the §4 Change Preview block.

## §4 Change Preview

After all §1 checks pass, §2 completes, and the user has confirmed the issue
assignments in §3, show the block below exactly as written and wait for the user
to respond.

```text
Change Preview — split <source-id> → <new-id-1> + <new-id-2>
Sheet:
  Retire row <row-source>  (H: retired, was: <source-status>)
  Append new row: <new-id-1> | <repo-1> | <category-1> | <title-1> | <status-1> | <persona-1>
  Append new row: <new-id-2> | <repo-2> | <category-2> | <title-2> | <status-2> | <persona-2>
Linear:
  1. Create label "<new-id-1>" under "User Flow" (color #5e6ad2)
  2. Create label "<new-id-2>" under "User Flow" (color #5e6ad2)
  3. Re-tag <open-issue-count> open issues:
     → <new-id-1>: <list of issue identifiers assigned to new-id-1>
     → <new-id-2>: <list of issue identifiers assigned to new-id-2>
  4. Archive label "<source-id>"  ← manual step

Confirm? (yes / confirm / abort)
```

Notes:

- `<row-source>` is the sheet row number for `<source-id>` (CSV data index + 2; see
  sheet-ops.md §4).
- `<source-status>` is the value read from column H of `<source-id>`'s matched row
  in §1.3.
- `<open-issue-count>` is the count of open issues from §2.

If the user responds with anything other than "yes" or "confirm", do not write any
changes and report:

```text
Operation cancelled. No changes were made.
```

Do not proceed to §5 unless the user explicitly responds "yes" or "confirm".

## §5 Execute — Retire Source Row

### §5.1 Schema guard

Before writing, verify the cached CSV has exactly 13 columns (A–M). If the count
differs, abort with:

```text
Sheet schema has drifted. Expected 13 columns (A–M), got <col-count>.
```

(See sheet-ops.md §7.)

### §5.2 Retire source row

Use the sheet-ops.md §5 cell update pattern:

- Range: `Flow Inventory!H<row-source>`
- Value: `retired`

Validate the tool response. If the call fails, abort and report the error. Do not
proceed to §6 or any later section.

## §6 Execute — Append Two New Rows

Append the new-id-1 row first, then the new-id-2 row. Use the sheet-ops.md §6 append
pattern for each. Verify each append succeeds before proceeding to the next.

### §6.1 Append new-id-1 row

Use sheet-ops.md §6 with the following values:

| Column | Value |
|---|---|
| A (`#`) | Count of data rows in cached CSV + 1 |
| B | `<new-id-1>` |
| C | `<repo-1>` |
| D | `<category-1>` |
| E | `<title-1>` |
| F | empty string |
| G | empty string |
| H | `<status-1>` |
| I | empty string |
| J | empty string |
| K | `<persona-1>` |
| L | empty string — **never write a formula here** (see sheet-ops.md §7) |
| M | `<new-id-1>` |

The cached count reflects the original row total before the retirement in §5 (the
cached CSV is not re-fetched); add 1 to get the new row number.

Validate the tool response. If the call fails, abort and report partial state (source
row retired, new-id-1 row not appended).

### §6.2 Append new-id-2 row

Use sheet-ops.md §6 with the following values:

| Column | Value |
|---|---|
| A (`#`) | Count of data rows in cached CSV + 2 |
| B | `<new-id-2>` |
| C | `<repo-2>` |
| D | `<category-2>` |
| E | `<title-2>` |
| F | empty string |
| G | empty string |
| H | `<status-2>` |
| I | empty string |
| J | empty string |
| K | `<persona-2>` |
| L | empty string — **never write a formula here** (see sheet-ops.md §7) |
| M | `<new-id-2>` |

Col A is one higher than the new-id-1 row (cached count + 2).

Validate the tool response. If the call fails, abort and report partial state (source
row retired, new-id-1 row appended, new-id-2 row not appended). Do not proceed to §7.

## §7 Execute — Create New Labels

### §7.1 Create label for new-id-1

Use `mcp__claude_ai_Linear__create_issue_label` with:

- `name`: `<new-id-1>`
- parent label name: `User Flow`
- `color`: `#5e6ad2`

Verify the response contains a valid label name before proceeding. If the call fails,
abort and report the error. Note the partial state: source row is retired, both new
sheet rows are appended, but `<new-id-1>` label was not created.

### §7.2 Create label for new-id-2

Use `mcp__claude_ai_Linear__create_issue_label` with:

- `name`: `<new-id-2>`
- parent label name: `User Flow`
- `color`: `#5e6ad2`

Verify the response contains a valid label name before proceeding. If the call fails,
abort and report the error. Note the partial state: source row is retired, both new
sheet rows are appended, `<new-id-1>` label was created, but `<new-id-2>` label was
not created. Do not proceed to §8.

## §8 Execute — Re-tag Open Issues

For each open issue, using the confirmed assignments recorded in §3, use
`mcp__claude_ai_Linear__save_issue` to:

- Add the assigned label (`<new-id-1>` or `<new-id-2>`)
- Remove label `<source-id>`

Process all issues. Report progress as you go:

> Re-tagged `<completed>`/`<open-issue-count>` issues…

If any individual issue update fails: log the failure, continue with the remaining
issues, and report all failures at the end. Do not abort the batch on a single
failure.

Log each failure as: `` `<identifier>: <title> — error: <message>` ``

If the §2 query was capped at 250, note after re-tagging:

> Warning: the open-issue query was capped at 250. Additional open issues may still
> carry the `<source-id>` label. Verify manually in Linear.

## §9 Surface Source Label for Archiving

Find `<source-id>`'s label ID from the Phase 0 cached label list. If the cached list
does not contain the ID (e.g. the session has been long-running), re-fetching Linear
labels via `mcp__claude_ai_Linear__list_issue_labels` is safe — the no-re-fetch rule
in sheet-ops.md §7 applies to the sheet only.

Present to the user:

> Linear label ready to archive: **`<source-id>`** (ID: `<label-id>`). Go to
> Linear → Settings → Labels, find the label, and archive it. The MCP has no archive
> call — this step is always manual.

## §10 Confirm Outputs

After §5–§9 complete, report:

> Split `<source-id>` → `<new-id-1>` + `<new-id-2>`. Source row retired. Two new rows
> appended. `<open-issue-count>` open issues re-tagged. [If any failures:
> `<fail-count>` issues failed re-tagging — see list above.] [If cap hit: Warning:
> the open-issue query was capped at 250 — additional open issues may still carry the
> `<source-id>` label. Verify manually.] Archive source label `<source-id>`
> (ID: `<label-id>`) manually in Linear → Settings → Labels.
