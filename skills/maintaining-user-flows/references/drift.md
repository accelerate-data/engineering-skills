# Drift Operation Reference

Drift is read-only. Phase 0 has already loaded the full sheet and all Linear "User Flow"
child labels into the working-memory cache. No additional fetch is needed before running drift.

---

## Step 1 — Compute A–B (sheet-only)

From the cached sheet, collect every row where col H is not `retired` and not `parked`. For
each such row, check whether a matching "User Flow" child label exists in the cached Linear
labels (exact match on col B = label name). Collect rows with no match — these are
sheet-only flows.

## Step 2 — Compute B–A (Linear-only)

From the cached Linear "User Flow" child labels, check whether a matching active row exists
in the cached sheet (col B match, col H not `retired` or `parked`). Collect labels with no
match — these are Linear-only labels.

## Step 3 — Report

Output both gap sets using this exact format:

```text
Drift Report — Flow Inventory vs Linear

Sheet-only (missing Linear label):
  <canonical-id-1>
  <canonical-id-2>

Linear-only (no active sheet row):
  <label-name-1>
  <label-name-2>

No action taken. Run an operation to fix.
```

When both lists are empty:

```text
Sheet and Linear are in sync. No action needed.
```

## Step 4 — When drift is called

Drift runs in two contexts:

1. **Natural-language invocation.** When the user asks to "check sync", "show drift",
   "compare sheet and Linear", "are they in sync?", or similar phrases — route to this
   reference and produce the report above.
2. **Post-change verification.** After every write operation, drift is re-run automatically
   on the updated cached state. Write operations must update the cached state after each
   successful mutation so verification reads the post-write sheet rows and label set from
   memory. Do not re-fetch the sheet for this step; the no-re-fetch rule still applies.
   In this context the output is prefixed with `Verification:` and focuses on remaining
   gaps (e.g. labels pending manual archiving):

```text
Verification: 1 Linear label still needs manual archiving — see instructions above.
```

or, when fully in sync:

```text
Verification: sheet and Linear are in sync for this operation.
```
