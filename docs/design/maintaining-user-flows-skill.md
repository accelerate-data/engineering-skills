# maintaining-user-flows Skill — Design Document

**Status:** Approved
**Issue:** AD-31
**Destination:** `engineering-skills` plugin

---

## Background

AD-31 ("Add flow inventory sync skill") and AD-43 ("maintaining-user-flows: new engineering-skills skill") were merged by design review. AD-31 is the surviving issue; AD-43 is closed as duplicate. This document is the canonical design incorporating all ACs from both issues.

The two issues shared: five write operations (add, retire, rename, merge, split), a confirmation gate, `gws` CLI for sheet ops, Linear MCP for label management, and manual label archiving. AD-31 added drift detection and post-change verification; AD-43 contributed the engineering-skills file structure and plugin packaging requirements.

---

## Scope

Flow list maintenance only:

- Maintain the **Flow Inventory** tab of the User-Flows-Details Google Sheet (col B = Canonical ID)
- Keep **Linear "User Flow" child labels** in sync with the sheet

Out of scope:

- Authoring or updating `docs/functional/` specs — that is `authoring-functional-spec`
- Filing or closing implementation issues — that is the `creating-linear-issue` / `closing-linear-issue` lifecycle
- Any sheet column other than B, C, D, E, H, K, M (never write col L)
- The numbered diagram flows table in the same spreadsheet

---

## Operations

| Operation | Writes? | Sheet change | Linear change |
|---|---|---|---|
| **add** | yes | Append new row (A–M) | Create "User Flow" child label |
| **retire** | yes | Update col H → `retired` | Archive label (warn if open issues) |
| **rename** | yes | Update col B + col E | Create new label, re-tag all issues, archive old label |
| **merge** (A+B→C) | yes | Retire A and B rows, append C | Create C label, re-tag all issues from A+B, archive A and B |
| **split** (A→B+C) | yes | Retire A, append B and C | Create B and C labels, re-tag open issues per AI-assisted user assignments, archive A |
| **drift** | no | — | — |

Drift compares the sheet and Linear state and reports gaps in both directions. It is invoked naturally ("check sync", "show drift", "are they in sync?") — no slash command needed.

---

## Shared Constants

| Constant | Value |
|---|---|
| Sheet ID | `1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA` |
| Sheet tab | `Flow Inventory` |
| Col A–M | #, Canonical ID, repo, Category, Flow Title, User Flow Owner, Product owner, Status, Wave, Classification, Persona, Filename (never write), Linear |
| Linear label parent | `User Flow` |
| Linear label color | `#5e6ad2` |

---

## Phase 0 — Preflight and Cache

Run once per invocation before any operation:

1. `gws auth status` — abort with `Run gws auth login first, then retry.` on non-zero exit
2. Load full sheet `Flow Inventory!A2:M` via `gws` — cache in working memory
3. Load all Linear "User Flow" child labels via `mcp__linear__list_issue_labels` — cache
4. Abort if CSV has fewer than 13 columns: "Sheet schema has drifted."

All validation, change preview, and execution consume the cached copy. Do not re-fetch mid-invocation.

---

## Confirmation Gate (write operations only)

Before executing any write:

1. Show a **Change Preview** block listing every write: sheet cell ranges and values, Linear label actions (create / re-tag count / archive notice)
2. Await user response of `yes` or `confirm`. Abort on anything else.
3. No silent mutations.

---

## Drift Detection

The drift operation compares cached sheet state against cached Linear labels and reports two gap sets:

- **A–B (sheet-only)**: active flows (col H ≠ `retired`, ≠ `parked`) with no matching "User Flow" label in Linear
- **B–A (Linear-only)**: "User Flow" child labels in Linear with no active matching row in the sheet

Output format:

```text
Drift Report — Flow Inventory vs Linear

Sheet-only (missing Linear label):
  flow-auth-login
  flow-onboarding-v2

Linear-only (no active sheet row):
  flow-legacy-import
  flow-admin-deprecated

No action taken. Run an operation to fix.
```

When no drift: `Sheet and Linear are in sync. No action needed.`

---

## Post-Change Verification

After every write operation, re-run the A–B / B–A comparison on the updated cached state and report:

```text
Verification: sheet and Linear are in sync for this operation.
```

Or if manual steps remain (e.g. label archiving is pending):

```text
Verification: 1 Linear label still needs manual archiving — see instructions above.
```

---

## Permission and Error Reporting

If any Linear mutation fails during a batch (re-tag, label create):

- Log the failure with issue identifier and error message
- Continue processing remaining items
- Surface all failures at the end: `Failed to re-tag: VD-1234 (403 Forbidden)`

Never silently swallow a failure.

---

## File Structure

```text
skills/maintaining-user-flows/
  SKILL.md
  references/
    sheet-ops.md
    add.md
    retire.md
    rename.md
    merge.md
    split.md
    drift.md
commands/
  add-flow.md
  retire-flow.md
  rename-flow.md
  merge-flows.md
  split-flow.md
```

`SKILL.md` frontmatter:

```yaml
---
name: maintaining-user-flows
description: >-
  Use when adding, retiring, renaming, merging, splitting, or checking sync for
  a canonical user flow across the User-Flows-Details Sheet and Linear "User Flow" labels.
  Flow list maintenance only — does not author functional specs or track implementation.
argument-hint: "add|retire|rename|merge|split|drift [canonical-id(s)]"
---
```

---

## AI Recommendation for Split

After fetching open issues from the source label, generate a recommendation table before the Change Preview:

```text
Issue       | Title                          | Recommended flow  | Rationale
VD-1234     | Add source connection setup    | <new-id-1>        | Matches ingestion setup scope
VD-5678     | Configure alert thresholds     | <new-id-2>        | Relates to alerting behaviour
```

User reviews and adjusts assignments, then confirms. The Change Preview follows with the confirmed assignments embedded.

---

## Acceptance Criteria

### Skill structure

- [ ] `skills/maintaining-user-flows/SKILL.md` exists with correct frontmatter, Phase 0 preamble, 6-operation routing table (add / retire / rename / merge / split / drift), confirmation gate contract, and safety rails
- [ ] `references/sheet-ops.md` documents sheet constants, Phase 0 auth check, full-sheet read, canonical-ID lookup, cell update pattern, append-row pattern, and "never do this" constraints
- [ ] Reference files exist for all 6 operations: `add.md`, `retire.md`, `rename.md`, `merge.md`, `split.md`, `drift.md`
- [ ] Command wrappers exist for the 5 write operations: `add-flow.md`, `retire-flow.md`, `rename-flow.md`, `merge-flows.md`, `split-flow.md`

### Operations

- [ ] **add**: validates no duplicate canonical ID in sheet or Linear; appends new row; creates Linear label; sets col M to canonical-id string
- [ ] **retire**: warns if open issues exist; updates col H → `retired`; surfaces label ID for manual archiving
- [ ] **rename**: validates new-id uniqueness; updates col B + col E; creates new label; re-tags all issues (open + closed); surfaces old label for archiving
- [ ] **merge**: validates both sources exist and are not retired; confirms new-id uniqueness; retires both source rows; appends new row; creates new label; re-tags all issues from both sources; surfaces both source labels for archiving
- [ ] **split**: validates source exists and is not retired; confirms both new IDs are unique; collects titles and metadata for new flows; presents AI recommendation table for open issue assignments; awaits user confirmation; retires source row; appends two new rows; creates two labels; re-tags only open issues per confirmed assignments; surfaces source label for archiving

### Drift

- [ ] **drift**: reads cached sheet and Linear labels; computes A–B and B–A gap sets; reports both lists; takes no action
- [ ] Output matches the format specified above (two named sections + "No action taken" footer)
- [ ] When no drift: reports `Sheet and Linear are in sync. No action needed.`

### Post-change verification

- [ ] After every write operation, the skill re-runs the A–B / B–A check on updated cached state and reports whether sync was achieved or what manual steps remain

### Error reporting

- [ ] If any Linear mutation fails, the failure is logged with issue identifier and error; processing continues; all failures are surfaced at the end
- [ ] No failure is silently swallowed

### Safety rails

- [ ] No write occurs without a preceding Change Preview and explicit `yes`/`confirm`
- [ ] Col L is never written
- [ ] Sheet rows are never deleted; retirement is col H update only
- [ ] If the sheet CSV has fewer than 13 columns, the skill aborts with "Sheet schema has drifted."
- [ ] No duplicate canonical IDs are created in the sheet
- [ ] No duplicate Linear "User Flow" child labels are created

### Plugin packaging

- [ ] Both `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` are version-bumped in lockstep (minor bump)
- [ ] `npm run validate:plugin-manifests` exits zero
- [ ] `repo-map.json` updated: skills count incremented, `maintaining-user-flows` entry added
- [ ] All new `.md` files pass `markdownlint`

---

## Design Decisions

| Decision | Rationale |
|---|---|
| Confirmation gate on every write | No silent mutations |
| Phase 0 cache loaded once | Avoids mid-operation drift; reduces API calls |
| Drift as a first-class operation | Read-only sync check without triggering a write flow |
| No slash command for drift | Takes no arguments; natural language routing is sufficient |
| Post-change verification | Closes the feedback loop; surfaces pending manual steps |
| split: open issues only for re-tagging | Closed issues on a retired label are historical records |
| rename/merge: re-tag all issues | Mapping is unambiguous (1:1 or N:1); historical issues should reflect current canonical ID |
| retire: warn, don't block on open issues | Team may intentionally retire a flow with in-flight work |
| Archive, not delete | Archived labels stay on historical issues for audit |
| Archive is manual UI step | Linear MCP has no archive call; skill surfaces label ID + instructions |
| Error reporting continues on failure | Batch operations should not abort mid-run; all failures surfaced at end |
