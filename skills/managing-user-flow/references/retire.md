# Retire Operation Reference

Use this reference when `managing-user-flow` is invoked with `operation=retire`.
Work through each section in order. Do not skip ahead to execution before validation
and the Change Preview are complete.

## §1 Validation

Perform all checks below before showing the Change Preview. A failure in any check
aborts the operation immediately.

### §1.1 Phase 0 prerequisite

The auth check (sheet-ops.md §2) and full-sheet read (sheet-ops.md §3) must already
be complete and cached in working memory before validation begins.

### §1.2 Canonical-ID existence — sheet

Using the cached CSV, run the canonical-ID lookup (sheet-ops.md §4) against column B
(exact match). If no matching row is found, abort with:

```text
Canonical ID '<id>' not found in Flow Inventory sheet. Add the row first.
```

### §1.3 Status pre-check

From the matched row, read column H. If the value is already `retired`, abort with:

```text
'<id>' is already retired.
```

### §1.4 Linear label check

Search the Phase 0 cached label list for a label named exactly `<canonical-id>` under
the "User Flow" parent. Note the result — a missing label is not an abort condition.

- If found: record the label's name and ID — both are needed in §5 and §6.
- If not found: record that no label exists; this affects the Change Preview and §5.

## §2 Open-Issue Warning

This is the first of two confirmation gates; §3 is the second. Both must fire in
sequence — do not skip either gate.

Use `mcp__linear__list_issues` filtered to label `<canonical-id>` with
`state` = `started`. Capture the count and list.

If open issues are found, list them (identifier + title) and display:

> These open issues are tagged `<canonical-id>`. Retiring will archive the label —
> issues keep the tag but the label is removed from the active picker. Continue?
> (yes / confirm / abort)

If the user responds with anything other than "yes" or "confirm", abort with:

```text
Operation cancelled. No changes were made.
```

If no open issues are found, skip this sub-step and proceed to §3 directly. No
confirmation is needed here — §3 provides the main gate.

## §3 Change Preview

After §1 and any §2 confirmation, show the block below exactly as written and wait
for the user to respond.

If the Linear label was found in §1.4:

```text
Change Preview — retire
Sheet: update Flow Inventory col H, row <row>
  H: retired  (was: <current-status>)
Linear: archive label "<canonical-id>"  [<issue-count> open issues remain tagged]  ← manual step

Confirm? (yes / confirm / abort)
```

If the Linear label was not found in §1.4:

```text
Change Preview — retire
Sheet: update Flow Inventory col H, row <row>
  H: retired  (was: <current-status>)
Linear: label "<canonical-id>" not found — nothing to archive

Confirm? (yes / confirm / abort)
```

Notes:

- `<row>` in the sheet range is the sheet row number from the §4 lookup
  (CSV data index + 2; see sheet-ops.md §4).
- `<issue-count>` is the open-issue count from §2. Show `[0 open issues]`
  if none were found.
- `<current-status>` is the value read from column H of the matched row in §1.3.

If the user responds with anything other than "yes" or "confirm", do not write any
changes and report:

```text
Operation cancelled. No changes were made.
```

Do not proceed to §4 unless the user explicitly responds "yes" or "confirm".

## §4 Execute — Update Sheet

Before writing, verify the cached CSV has exactly 13 columns (A–M). If the count
differs, abort with:

```text
Sheet schema has drifted. Expected 13 columns (A–M), got <N>.
```

(See sheet-ops.md §7.)

Use the sheet-ops.md §5 cell update pattern to set column H of the identified row
to `retired`:

- Range: `Flow Inventory!H<row>` where `<row>` = CSV data index + 2
- Value: `retired`

Validate the tool response before proceeding. If the update call fails, abort and
report the error. Do not proceed to §5.

## §5 Surface Label for Archiving

If the label was found in §1.4, present the following to the user:

> Linear label ready to archive: **`<canonical-id>`** (ID: `<label-id>`). Go to
> Linear → Settings → Labels, find the label, and archive it. The MCP has no
> archive call — this step is always manual.

If the label was not found in §1.4, skip this step. The §6 output will note the
absence.

## §6 Confirm Outputs

If the label was found in §1.4:

```text
Retired '<canonical-id>' in sheet (col H = retired). Archive Linear label '<canonical-id>' (ID: <label-id>) manually in Linear → Settings → Labels.
```

If the label was not found in §1.4:

```text
Retired '<canonical-id>' in sheet (col H = retired). No matching Linear label found — nothing to archive.
```
