# managing-user-flow Skill — Implementation Plan (AD-43)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `managing-user-flow` skill to the engineering-skills plugin. The skill maintains the canonical user flow list across two surfaces: the User-Flows-Details Google Sheet (Flow Inventory tab, col B) and Linear "User Flow" child labels. This is flow list maintenance only — no `docs/functional/` spec authoring, no implementation tracking.

**Architecture:** Single skill with per-operation reference files plus five thin slash-command wrappers. Phase 0 is a shared preamble (gws auth, full sheet load, full Linear label load) cached once per invocation. After resolving the operation and arguments, the skill shows a Change Preview and requires explicit user approval before writing anything. Each operation is self-contained in its own reference file. All sheet writes use `gws sheets spreadsheets values update` (cell range) or `gws sheets spreadsheets values append` (new row). All Linear label mutations use MCP tools (`mcp__linear__create_issue_label`, `mcp__linear__save_issue` for re-tagging). Label archiving is a manual Linear UI step — the MCP has no archive or delete call for labels. Archiving (not deleting) is preferred: it preserves the label on historical issues while removing it from the active label picker.

**Tech Stack:** Markdown (skill, commands, references), `gws` CLI (sheet read/write), Linear MCP tools (label create, issue list and re-tag), `npm run validate:plugin-manifests` and `npm run check:plugin-version` for manifest gates.

---

## Sheet and Linear constants

These values are used across all reference files and must not be hardcoded inline — they live in `references/sheet-ops.md` and are referenced by name from other files.

| Constant | Value |
|---|---|
| Sheet ID | `1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA` |
| Sheet tab | `Flow Inventory` |
| Col A | `#` (row number) |
| Col B | Canonical ID |
| Col C | repo |
| Col D | Category |
| Col E | Flow Title |
| Col F | User Flow Owner |
| Col G | Product owner |
| Col H | Status |
| Col I | Wave |
| Col J | Classification |
| Col K | Persona |
| Col L | Filename (HYPERLINK formula — never overwrite) |
| Col M | Linear |
| Linear label parent | `User Flow` |
| Linear label color | `#5e6ad2` |

---

## File Structure

| File | Responsibility |
|---|---|
| `skills/managing-user-flow/SKILL.md` | Skill entry point: trigger conditions, Phase 0 preamble, operation routing table, confirmation gate contract |
| `skills/managing-user-flow/references/sheet-ops.md` | Sheet coordinates, all `gws` read/write command patterns, auth check, column layout constants |
| `skills/managing-user-flow/references/add.md` | Add operation: validate, change preview, append row, create Linear label |
| `skills/managing-user-flow/references/retire.md` | Retire operation: validate, open-issue warning, change preview, update col H, surface label ID for archiving |
| `skills/managing-user-flow/references/rename.md` | Rename operation: validate, change preview, update col B+E, create new label, re-tag all issues, surface old label for archiving |
| `skills/managing-user-flow/references/merge.md` | Merge operation: validate two sources + new target, change preview, retire both rows, append new row, create label, re-tag all issues, surface old labels for archiving |
| `skills/managing-user-flow/references/split.md` | Split operation: validate source + two targets, change preview, retire source row, append two new rows, create two labels, surface open issues with AI recommendation, re-tag after user approval, surface source label for archiving |
| `commands/add-flow.md` | `/add-flow <canonical-id>` — thin wrapper invoking managing-user-flow for add |
| `commands/retire-flow.md` | `/retire-flow <canonical-id>` — thin wrapper for retire |
| `commands/rename-flow.md` | `/rename-flow <old-id> <new-id> [new-title]` — thin wrapper for rename |
| `commands/merge-flows.md` | `/merge-flows <id-a> <id-b> <new-id> <new-title>` — thin wrapper for merge |
| `commands/split-flow.md` | `/split-flow <id> <new-id-1> <new-id-2>` — thin wrapper for split |
| `.claude-plugin/plugin.json` | Version bump (minor — new skill) |
| `.codex-plugin/plugin.json` | Version bump in lockstep |
| `repo-map.json` | Update skills count and add managing-user-flow entry |

---

## Confirmed design decisions

1. **Confirmation gate on every operation.** Show a Change Preview block listing every write (sheet cell ranges + Linear label actions + issue re-tag count) before executing. Require the user to respond with "yes" or "confirm". No silent mutations.
2. **Phase 0 cache.** Load the full sheet (Flow Inventory!A2:M) and all Linear "User Flow" child labels once at the start of every invocation. Reuse these for validation, change preview, and execution.
3. **Split: open issues only.** For split, only open Linear issues tagged to the source label are surfaced for re-tagging. Closed issues remain on the source (retired) label.
4. **Rename and Merge: all issues.** Because the mapping is unambiguous (1:1 for rename, N:1 for merge), all issues (open + closed) are re-tagged.
5. **Retire: warn but allow.** If the label to be retired has open issues, list them and warn the user. Proceed only after explicit confirmation. Do not block on closed issues.
6. **Col L is never written.** The Filename column contains HYPERLINK formulas managed by sheet owners. The skill must never write to col L.
7. **Col M (Linear) is updated on Add only.** After creating the Linear label, record the label name in col M of the new row. For all other operations, col M is left as-is.

---

## Task 1: Create `references/sheet-ops.md`

**Files:**

- Create: `skills/managing-user-flow/references/sheet-ops.md`

- [ ] **Step 1: Document sheet coordinates**

Write the sheet ID, tab name, and full column mapping table (A through M) from the constants table above. Mark col L as "never write" and col M as "written on Add only".

- [ ] **Step 2: Document Phase 0 auth check**

```bash
gws auth status
```

Exit code 0 = authenticated. Non-zero or missing binary = abort with: `Run gws auth login first, then retry.`

- [ ] **Step 3: Document the full-sheet read**

```bash
gws sheets spreadsheets values get \
  --params '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!A2:M"}' \
  --format csv
```

Document: cache the result in working memory. All validation and change-preview steps consume the cached copy. Do not re-fetch mid-invocation.

- [ ] **Step 4: Document canonical-ID lookup**

```bash
# From cached CSV, find the row where col B == <canonical-id>
# awk -F, -v id="<canonical-id>" '$2 == id'
```

If no row matches: abort with "Canonical ID `<id>` not found in Flow Inventory sheet. Add the row first."

- [ ] **Step 5: Document cell update pattern**

```bash
gws sheets spreadsheets values update \
  --params '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!H<row>","valueInputOption":"USER_ENTERED"}' \
  --json '{"values":[["retired"]]}'
```

Explain: row number is determined from the cached CSV (1-indexed, +1 for the header row). Parameterise the range and the value body.

- [ ] **Step 6: Document append-row pattern**

```bash
gws sheets spreadsheets values append \
  --params '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!A:M","valueInputOption":"USER_ENTERED","insertDataOption":"INSERT_ROWS"}' \
  --json '{"values":[["<#>","<canonical-id>","<repo>","<category>","<title>","","","<status>","","","<persona>","","<linear-label>"]]}'
```

Document: col L (Filename, index 11) is always written as empty string. Col M (Linear, index 12) is set to the new canonical-id string after label creation.

- [ ] **Step 7: Document "never do this" constraints**

- Never write to col L (Filename HYPERLINK formula).
- Never delete a sheet row — retire by updating col H only.
- Never assume col layout — if the CSV has fewer than 13 columns, abort: "Sheet schema has drifted."

---

## Task 2: Create `SKILL.md`

**Files:**

- Create: `skills/managing-user-flow/SKILL.md`

- [ ] **Step 1: Write frontmatter**

```yaml
---
name: managing-user-flow
description: >-
  Use when adding, retiring, renaming, merging, or splitting a canonical user
  flow in the User-Flows-Details Sheet and its paired Linear "User Flow" label.
  Flow list maintenance only — does not author functional specs or track implementation.
argument-hint: "add|retire|rename|merge|split [canonical-id(s)]"
---
```

- [ ] **Step 2: Write When to Use section**

Cover: user asks to add a new flow, retire an existing one, rename a canonical ID, merge two flows into one, or split one flow into two. Note explicitly: this skill does not create `docs/functional/` folders, does not file implementation issues, and does not author specs.

- [ ] **Step 3: Write Checklist**

```
- [ ] Phase 0 — Preflight (gws auth, load sheet, load Linear labels)
- [ ] Phase 1 — Identify operation and arguments
- [ ] Phase 2 — Validate inputs
- [ ] Phase 3 — Change Preview (show all changes, await approval)
- [ ] Phase 4 — Execute changes
- [ ] Phase 5 — Confirm outputs
```

- [ ] **Step 4: Write Phase 0 — Preflight**

1. Verify `gws` is installed and `gws auth status` exits zero; abort with `Run gws auth login first, then retry.`
2. Load full sheet via `references/sheet-ops.md` §3. Cache result.
3. Load all Linear "User Flow" child labels via `mcp__linear__list_issue_labels`. Cache result.
4. Confirm operation from invocation context (argument or user message). If ambiguous, ask once: "Which operation? add / retire / rename / merge / split"

- [ ] **Step 5: Write Phase 1 — Identify operation and arguments**

Route to the matching reference file based on operation:

| Operation | Reference | Required args |
|---|---|---|
| add | `references/add.md` | canonical-id, repo, category, title, status, persona |
| retire | `references/retire.md` | canonical-id |
| rename | `references/rename.md` | old-id, new-id (and optionally new-title) |
| merge | `references/merge.md` | id-a, id-b, new-id, new-title |
| split | `references/split.md` | source-id, new-id-1, new-title-1, new-id-2, new-title-2 |

If any required arg is missing, resolve by asking the user before proceeding.

- [ ] **Step 6: Write Phases 2–5 as stubs pointing to reference files**

Each phase is operation-specific. The SKILL.md delegates to the matching `references/<operation>.md` for validation, change-preview content, and execution steps. The confirmation gate contract (Phase 3) is universal: present the Change Preview block, wait for "yes" or "confirm", abort on anything else.

- [ ] **Step 7: Write Safety rails section**

- Never write to the sheet without showing the Change Preview and receiving explicit approval.
- Never delete a sheet row — retire only via col H.
- Never write to col L.
- Never assume col layout; abort if CSV has fewer than 13 columns.
- Never create a duplicate canonical ID in the sheet or a duplicate Linear label.

---

## Task 3: Create `references/add.md`

**Files:**

- Create: `skills/managing-user-flow/references/add.md`

- [ ] **Step 1: Validation**

- Confirm canonical-id is not already present in cached sheet (col B exact match).
- Confirm canonical-id does not already exist as a Linear "User Flow" label.
- Confirm required fields are present: canonical-id, repo, category, title, status, persona. Ask for any missing field.
- Validate `status` is one of: `not-started`, `early`, `feature-complete`, `working`, `parked`, `retired`.

- [ ] **Step 2: Change Preview block**

```
Change Preview — add
Sheet: append row to Flow Inventory
  B: <canonical-id>
  C: <repo>
  D: <category>
  E: <title>
  H: <status>
  K: <persona>
  M: <canonical-id>  (set after label creation)
Linear: create label "<canonical-id>" under "User Flow" (color #5e6ad2)

Confirm? (yes / abort)
```

- [ ] **Step 3: Execute — create Linear label first**

Use `mcp__linear__create_issue_label` with `name: <canonical-id>`, `parent: "User Flow"`, `color: "#5e6ad2"`. Capture confirmation.

- [ ] **Step 4: Execute — append sheet row**

Use `references/sheet-ops.md` §6 append pattern. Set col M to the canonical-id string. Leave col L empty.

- [ ] **Step 5: Confirm outputs**

Report: "Added `<canonical-id>` to Flow Inventory (row appended) and created Linear label."

---

## Task 4: Create `references/retire.md`

**Files:**

- Create: `skills/managing-user-flow/references/retire.md`

- [ ] **Step 1: Validation**

- Confirm canonical-id exists in cached sheet (col B exact match).
- Confirm col H is not already `retired`; if it is, abort: "Already retired."
- Check whether a Linear "User Flow" label with this canonical-id exists.

- [ ] **Step 2: Open-issue warning**

Use `mcp__linear__list_issues` with `label: <canonical-id>` and `state: started` (or equivalent open filter). If any open issues are found, list them (identifier + title) and warn:

> These open issues are tagged `<canonical-id>`. Retiring will archive the label — issues keep the tag but the label is removed from the active picker. Continue?

Require explicit confirmation before proceeding.

- [ ] **Step 3: Change Preview block**

```
Change Preview — retire
Sheet: update Flow Inventory col H, row <N>
  H: retired  (was: <current-status>)
Linear: archive label "<canonical-id>"  [<N> open issues remain tagged]

Confirm? (yes / abort)
```

- [ ] **Step 4: Execute — update sheet**

Use `references/sheet-ops.md` §5 update pattern targeting the col H cell of the identified row.

- [ ] **Step 5: Surface label for archiving**

If the label exists: use `mcp__linear__list_issue_labels` to get the label ID and name. Present them to the user with the instruction to archive via Linear settings (Settings → Labels → archive). The MCP has no archive call — this step is always manual.

Example output:

> Linear label ready to archive: **`<canonical-id>`** (ID: `<id>`). Go to Linear → Settings → Labels, find the label, and archive it.

- [ ] **Step 6: Confirm outputs**

Report: "Retired `<canonical-id>` in sheet (col H = retired). Archive Linear label `<canonical-id>` (ID: `<id>`) manually in Linear settings."

---

## Task 5: Create `references/rename.md`

**Files:**

- Create: `skills/managing-user-flow/references/rename.md`

- [ ] **Step 1: Validation**

- Confirm old-id exists in cached sheet (col B exact match).
- Confirm col H is not `retired` for old-id; if it is, abort: "Cannot rename a retired flow. Use add instead."
- Confirm new-id does not already exist in sheet or Linear labels.
- If new-title is not provided, default to the existing col E value.

- [ ] **Step 2: List all issues tagged with old-id**

Use `mcp__linear__list_issues` with `label: <old-id>`, `limit: 250`. Count total. All will be re-tagged (open and closed).

- [ ] **Step 3: Change Preview block**

```
Change Preview — rename
Sheet: update Flow Inventory row <N>
  B: <new-id>  (was: <old-id>)
  E: <new-title>  (was: <old-title>)
Linear:
  1. Create label "<new-id>" under "User Flow" (color #5e6ad2)
  2. Re-tag <N> issues from "<old-id>" → "<new-id>"
  3. Archive label "<old-id>"  (manual step — instructions provided after)

Confirm? (yes / abort)
```

- [ ] **Step 4: Execute — update sheet**

Update col B and col E of the identified row using `references/sheet-ops.md` §5 pattern. Use a single batchUpdate range covering both columns (e.g., `Flow Inventory!B<row>:E<row>` with sparse values if needed, or two sequential updates).

- [ ] **Step 5: Execute — create new Linear label**

Use `mcp__linear__create_issue_label` with new-id, parent "User Flow", color "#5e6ad2".

- [ ] **Step 6: Execute — re-tag all issues**

For each issue returned in Step 2: use `mcp__linear__save_issue` to add the new label and remove the old label. Process in batches; report progress ("Re-tagged 12/47 issues…"). If any issue update fails, log it and continue — report failures at the end.

- [ ] **Step 7: Surface old label for archiving**

Use the same pattern as retire Step 5. Present the old label ID and name with the instruction to archive via Linear settings.

- [ ] **Step 8: Confirm outputs**

Report: "Renamed `<old-id>` → `<new-id>` in sheet. <N> issues re-tagged to `<new-id>`. Archive old label `<old-id>` (ID: `<id>`) manually in Linear settings."

---

## Task 6: Create `references/merge.md`

**Files:**

- Create: `skills/managing-user-flow/references/merge.md`

- [ ] **Step 1: Validation**

- Confirm id-a and id-b both exist in cached sheet (col B exact match).
- Confirm neither id-a nor id-b has col H = `retired`.
- Confirm new-id does not already exist in sheet or Linear labels.
- Confirm new-title is provided; if not, ask.
- Ask user for new-id's repo, category, status, and persona (suggest defaults from id-a).

- [ ] **Step 2: List issues from both source labels**

Use `mcp__linear__list_issues` for each source label separately (limit 250). Deduplicate by issue ID (an issue could theoretically carry both labels). Total = union count.

- [ ] **Step 3: Change Preview block**

```
Change Preview — merge <id-a> + <id-b> → <new-id>
Sheet:
  Retire row <Na> (col H: retired, was: <status-a>)
  Retire row <Nb> (col H: retired, was: <status-b>)
  Append new row: <new-id> | <repo> | <category> | <new-title> | <status> | <persona>
Linear:
  1. Create label "<new-id>" under "User Flow" (color #5e6ad2)
  2. Re-tag <N> issues from "<id-a>" and "<id-b>" → "<new-id>"
  3. Archive labels "<id-a>" and "<id-b>"  (manual step — instructions provided after)

Confirm? (yes / abort)
```

- [ ] **Step 4: Execute — retire source rows**

Update col H for both rows to `retired`.

- [ ] **Step 5: Execute — append new row**

Use append pattern from `references/sheet-ops.md` §6.

- [ ] **Step 6: Execute — create new label and re-tag**

Create `new-id` label. Re-tag all issues (from both source labels). Remove source labels from each issue. Report progress.

- [ ] **Step 7: Surface source labels for archiving**

Use the same pattern as retire Step 5 for both `<id-a>` and `<id-b>`. Present both label IDs with the instruction to archive via Linear settings.

- [ ] **Step 8: Confirm outputs**

Report: "Merged `<id-a>` + `<id-b>` → `<new-id>`. <N> issues re-tagged. Archive source labels `<id-a>` and `<id-b>` manually in Linear settings."

---

## Task 7: Create `references/split.md`

**Files:**

- Create: `skills/managing-user-flow/references/split.md`

- [ ] **Step 1: Validation**

- Confirm source-id exists in cached sheet.
- Confirm col H is not `retired` for source-id.
- Confirm new-id-1 and new-id-2 do not already exist in sheet or Linear labels.
- Confirm titles for both new flows are provided; if not, ask.
- Ask for repo, category, status, and persona for each new flow (suggest source-id values as defaults).

- [ ] **Step 2: Fetch open issues from source label**

Use `mcp__linear__list_issues` with `label: <source-id>` and filter to open states only (exclude completed, cancelled, duplicate). Present count.

- [ ] **Step 3: Generate AI recommendation for each open issue**

For each open issue (identifier, title, description excerpt): read the issue and recommend which of the two new flows it belongs to, with a one-line rationale. Format as a table:

```
Issue       | Title                        | Recommended flow | Rationale
VD-1234     | Add source connection setup  | <new-id-1>      | Matches ingestion setup scope
VD-5678     | Configure alert thresholds   | <new-id-2>      | Relates to alerting behaviour
```

Ask: "Review the recommendations above. Adjust any assignments, then confirm."

- [ ] **Step 4: Change Preview block**

Show after user confirms the re-tag assignments:

```
Change Preview — split <source-id> → <new-id-1> + <new-id-2>
Sheet:
  Retire row <N> (col H: retired, was: <status>)
  Append new row: <new-id-1> | <repo-1> | <cat-1> | <title-1> | <status-1> | <persona-1>
  Append new row: <new-id-2> | <repo-2> | <cat-2> | <title-2> | <status-2> | <persona-2>
Linear:
  1. Create label "<new-id-1>" under "User Flow" (color #5e6ad2)
  2. Create label "<new-id-2>" under "User Flow" (color #5e6ad2)
  3. Re-tag open issues:
     → <new-id-1>: VD-1234, VD-…
     → <new-id-2>: VD-5678, VD-…
  4. Archive label "<source-id>"  (manual step — instructions provided after)

Confirm? (yes / abort)
```

- [ ] **Step 5: Execute — retire source row**

Update col H for source-id row to `retired`.

- [ ] **Step 6: Execute — append two new rows**

Append new-id-1 row, then new-id-2 row.

- [ ] **Step 7: Execute — create new labels**

Create new-id-1 and new-id-2 labels.

- [ ] **Step 8: Execute — re-tag open issues**

For each open issue: add the confirmed target label, remove the source label.

- [ ] **Step 9: Surface source label for archiving**

Use the same pattern as retire Step 5. Present the source label ID and name with the instruction to archive via Linear settings.

- [ ] **Step 10: Confirm outputs**

Report: "Split `<source-id>` → `<new-id-1>` + `<new-id-2>`. <N> open issues re-tagged. Archive source label `<source-id>` (ID: `<id>`) manually in Linear settings."

---

## Task 8: Create command wrappers

**Files:**

- Create: `commands/add-flow.md`
- Create: `commands/retire-flow.md`
- Create: `commands/rename-flow.md`
- Create: `commands/merge-flows.md`
- Create: `commands/split-flow.md`

Each command follows the same pattern as `commands/author-flow-spec.md`: frontmatter description, usage block, and a "What this does" bullet list delegating to the skill.

- [ ] **Step 1: `commands/add-flow.md`**

```markdown
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
```

- [ ] **Step 2: `commands/retire-flow.md`**

Same pattern. Usage: `/retire-flow <canonical-id>`. What it does: validates, checks for open issues (warns), shows preview, updates col H to `retired`, surfaces label ID for archiving in Linear settings.

- [ ] **Step 3: `commands/rename-flow.md`**

Usage: `/rename-flow <old-id> <new-id> [new-title]`. What it does: validates, shows preview with issue re-tag count, updates sheet cols B+E, creates new label, re-tags all issues, surfaces old label for archiving in Linear settings.

- [ ] **Step 4: `commands/merge-flows.md`**

Usage: `/merge-flows <id-a> <id-b> <new-id> "<new-title>"`. What it does: validates both sources and new target, collects metadata, shows preview, retires both rows, appends new row, creates label, re-tags all issues, surfaces old labels for archiving in Linear settings.

- [ ] **Step 5: `commands/split-flow.md`**

Usage: `/split-flow <source-id> <new-id-1> <new-id-2>`. What it does: validates, fetches open issues, generates AI recommendation table, collects user confirmation on assignments, shows full preview, retires source, appends two new rows, creates two labels, re-tags open issues, surfaces source label for archiving in Linear settings.

---

## Task 9: Manifest and repo-map updates

**Files:**

- Modify: `.claude-plugin/plugin.json`
- Modify: `.codex-plugin/plugin.json`
- Modify: `repo-map.json`

- [ ] **Step 1: Bump plugin versions**

Both manifests must move in lockstep (per AGENTS.md). This is a new skill addition → minor bump: `1.1.9 → 1.2.0`.

- [ ] **Step 2: Update `repo-map.json`**

- Increment the skills count in the `skills` module description (15 → 16).
- Add `managing-user-flow` to the `eval_all` description note (no eval package exists yet — note that).
- Add new eval commands entry as "not yet" or omit until an eval is added.
- Update `generated_at` to today's date.

---

## Task 10: Validation

**Files:** none

- [ ] **Step 1: Run manifest validators**

```bash
cd /Users/hbanerjee/src/engineering-skills
npm run validate:plugin-manifests
npm run check:plugin-version
```

Both must exit zero.

- [ ] **Step 2: Markdownlint all new and changed files**

```bash
markdownlint \
  skills/managing-user-flow/SKILL.md \
  skills/managing-user-flow/references/sheet-ops.md \
  skills/managing-user-flow/references/add.md \
  skills/managing-user-flow/references/retire.md \
  skills/managing-user-flow/references/rename.md \
  skills/managing-user-flow/references/merge.md \
  skills/managing-user-flow/references/split.md \
  commands/add-flow.md \
  commands/retire-flow.md \
  commands/rename-flow.md \
  commands/merge-flows.md \
  commands/split-flow.md \
  docs/plan/2026-05-05-managing-user-flow-skill.md
```

- [ ] **Step 3: Run eval coverage gate**

```bash
cd tests/evals && npm run eval:coverage
```

This checks that the new skill is not accidentally skipped from coverage tracking.

- [ ] **Step 4: Run Codex compatibility gate**

```bash
cd tests/evals && npm run eval:codex-compatibility
```

---

## Task 11: Commit and PR

**Files:** none

- [ ] **Step 1: Stage and commit all new files**

Group into one atomic commit:

```
feat: add managing-user-flow skill for canonical flow list maintenance

Adds skill + 5 command wrappers. Supports add, retire, rename, merge,
and split operations across the Flow Inventory sheet and Linear
"User Flow" labels. Bumps plugin version 1.1.9 → 1.2.0.
```

- [ ] **Step 2: Push to origin/main**

```bash
git push origin main
```

- [ ] **Step 3: Open PR via raising-linear-pr skill**

Once pushed, hand off to `engineering-skills:raising-linear-pr`.

---

## Out of Scope

- Authoring or updating `docs/functional/<id>/README.md` — that is `authoring-functional-spec`'s responsibility.
- Filing or closing implementation Linear issues — that is the `creating-linear-issue` / `closing-linear-issue` lifecycle.
- Editing any column other than B, C, D, E, H, K, M in the sheet.
- Writing col L (Filename HYPERLINK formula) — never.
- Adding a promptfoo eval package — deferred to a follow-on issue after the skill is proven in use.
- Handling the second table in the spreadsheet (the numbered diagram flows) — that is a separate sheet view and is not maintained by this skill.
