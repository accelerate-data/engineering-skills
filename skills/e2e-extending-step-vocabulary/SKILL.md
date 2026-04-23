---
name: e2e-extending-step-vocabulary
description: Use when a BDD E2E `.feature` draft needs a step pattern that does not yet exist in `steps/*.md` — triggered by a `# MISSING STEP:` comment or by the agent detecting a pattern gap. Adds the new entry to the correct `steps/*.md` file with an exact tool-call recipe that matches neighbor format. Works from any repo when `E2E_HARNESS_ROOT` points to the harness. Do NOT use for drafting scenarios (use `e2e-adding-scenario`), for creating a brand-new `.feature` (use `e2e-authoring-feature-file`), or for regenerating from a user guide (use `e2e-regenerating-from-guide`) — this skill only edits `steps/*.md`.
---

# e2e-extending-step-vocabulary

## Harness context

Resolve these values before every other step in this skill:

1. **Harness root** — use `$E2E_HARNESS_ROOT` if set. Otherwise treat the current working directory as the harness root. If the CWD does not contain `features/` and `steps/` directories, emit one note: "Tip: set `E2E_HARNESS_ROOT=<path-to-harness>` for cross-repo use." Then continue.
2. All file references in this skill — `steps/`, `docs/assertion-backends.md` — are relative to the resolved harness root.

## When to use

Extend `steps/*.md` with a new pattern. Triggers:

- A `.feature` draft (from any of the authoring skills) contains a `# MISSING STEP:` comment.
- The agent detected a vocabulary gap while drafting and paused before finalizing the `.feature`.
- A reviewer asked for a new reusable step that the current vocabulary cannot express without contortion.

## When NOT to use

- The user wants to write or change a `.feature` file — use `e2e-adding-scenario` (append) or `e2e-authoring-feature-file` (new file).
- The pattern already exists (synonym of an existing entry) — decline and point to the existing pattern; do not add a near-duplicate.
- A single request mixes two assertion backends in one step (e.g. a UI click AND a DB verify) — refuse and ask the caller to split into two steps.
- The pattern is ambiguous (same natural-language wording maps to two or more different tool commands) — refuse and ask the caller to disambiguate.
- The pattern would be used in exactly one scenario in one `.feature` file — ask the caller first whether to simplify the scenario to existing vocabulary instead of adding bespoke grammar.

## Output format

Emit exactly two sections, in this order:

1. **PLAN** (H2 or bold heading): a short prose block covering judgment calls. Must include, in this order:
   - **Backend classification** — one of `ui` / `api` / `db` / `fs` / `log` / `other` per `{harness_root}/docs/assertion-backends.md`.
   - **Target file** — the exact `steps/*.md` filename the entry belongs to. Use the explicit label `Target:` on a line by itself so reviewers can grep for it.
   - **Reusability check** — one line saying whether the pattern is reusable across features, one-feature-only, or a near-duplicate of something already in the file.
   - **Refusal rationale** (if any) — if the request is cross-backend, ambiguous, a near-duplicate, or too narrow, this is the only content you emit below PLAN. Do NOT proceed to the PROPOSED ENTRY section; state the refusal and the recommended next action (split, disambiguate, reuse existing, or ask the user).
2. **PROPOSED ENTRY** (H2 or bold heading, only when the pattern is accepted): the exact markdown to splice into the target `steps/*.md` file. Match the target file's existing formatting — most files use a two-column markdown table (`| Step pattern | Action |`). Mirror the column widths, the backtick conventions, and any sectioning (e.g. `## Given steps` / `## When steps` / `## Then steps` blocks in `ui-actions.md`, the `{DB_CMD}` placeholder convention in `db-assertions.md`). Below the table row, include a short prose block covering the **failure mode** and a concrete **`{{RUN_ID}}` example** of how a `.feature` scenario would call the pattern.

### Output rules

- The pattern line uses `{placeholder}` tokens for every value that should vary between scenarios. Never bake a concrete literal into the pattern.
- The tool recipe is the exact command (or `browser_*` MCP call) that will run. No placeholder commands like "use curl somehow" or "call the appropriate MCP tool" — write the literal invocation.
- For DB patterns: document BOTH dialects. Use the `{DB_CMD}` placeholder (matching `db-assertions.md` convention — the harness injects `sqlite3 "$DATABASE_PATH"` locally or `psql "$DATABASE_URL" -t -A -c` remotely) OR spell out both invocations explicitly.
- For log and FS patterns: document BOTH the local variant (`grep` on `$DATA_DIR/logs/server*.log`, `test -d`, etc.) AND the remote variant (`az storage file download` + grep, `az storage file exists`, etc.) per `log-assertions.md` / `fs-assertions.md`.
- For UI patterns: follow the snapshot-first convention — `browser_snapshot` BEFORE any `browser_click` / `browser_drag` / `browser_fill_form`. Use refs from the snapshot, not CSS selectors.
- **Disallowed tools.** Never use `browser_evaluate` or `browser_wait_for` in a recipe — both are globally blocked by the harness. Use `browser_run_code` with a polling loop instead when a wait is genuinely needed.
- For Fabric / OneLake patterns: use the pre-generated `$DFS_BEARER` env var. Never self-mint an SP token (no `az account get-access-token` inside the step). If `$DFS_BEARER` is empty at runtime, fail immediately.
- **Failure mode.** Every pattern's recipe documents what "FAIL" looks like and states that there is NO retry on miss, no silent fallback to a different backend or command. Match the tone of `log-assertions.md` ("No retry on grep miss... If `grep` returns 0 matches, mark the step as FAIL immediately").
- **`{{RUN_ID}}` example.** When the pattern's placeholders would touch data the test seeds (a domain name, an intent title, a repo branch, a file path under `uploads/`, a log text containing a seeded slug), the example scenario call MUST embed `{{RUN_ID}}` in the concrete literal (e.g. `"e2e-domain-{{RUN_ID}}"`). UI chrome labels (buttons, menus) are not data literals and stay as the app renders them.
- **Path hygiene.** Never write a hardcoded absolute path in any recipe or example. Reference paths by env-var name (`$APP_SRC`, `$DATABASE_PATH`, `$DATA_DIR`, `$DOMAINS_PATH`, `$TMP_DIR`). Describe derivation abstractly when relevant (`$APP_SRC = dirname(dirname($DATABASE_PATH))`).

## Checklist

Do each step in order. Do not skip.

1. **Classify the backend.** Read `{harness_root}/docs/assertion-backends.md` if ambiguous. Pick exactly one of `ui` / `api` / `db` / `fs` / `log` / `other` (where `other` = GitHub/gh, Fabric/OneLake, git, dbt, generic shell). Map to the target file:
   - `ui` action → `steps/ui-actions.md`
   - `ui` assertion → `steps/ui-assertions.md`
   - `api` → `steps/api-assertions.md`
   - `db` → `steps/db-assertions.md`
   - `fs` → `steps/fs-assertions.md`
   - `log` → `steps/log-assertions.md`
   - `other` → `steps/other-headless-actions.md` (or `steps/skill-steps.md` when the step delegates to a skill file)
2. **Refusal gates.** Stop and refuse if any of the following hold. Emit PLAN with the refusal rationale and no PROPOSED ENTRY:
   - **Cross-backend** — the request mixes two backends in one step (e.g. UI click + DB verify). Invariant: one backend per step. Ask the caller to split into two steps and stop.
   - **Ambiguous** — the same natural-language wording could map to two or more distinct tool commands. Propose at least two disambiguated alternatives and ask the caller to pick before you draft.
   - **Near-duplicate** — an existing entry in the target file covers the same assertion semantics (even if the wording differs by synonym). Point the caller to the existing pattern and decline to add a synonym; pattern uniqueness is the rule.
3. **Reusability check.** If the pattern is likely to be used in exactly one scenario in one `.feature` file, flag it and propose a rewrite that uses existing vocabulary. Ask the caller whether to simplify the scenario instead of adding bespoke grammar. Do not emit the PROPOSED ENTRY until the caller picks. If the caller insists, proceed.
4. **Read 2–3 neighbors** in the target file. Match their format exactly — table layout, backtick conventions, sectioning (Given / When / Then), placeholder naming (e.g. `{name}`, `{domain}`, `{path}`), and any file-specific conventions (`{DB_CMD}`, `$DFS_BEARER`, `{LOG_DIR}`). The PROPOSED ENTRY must look like it was written by whoever wrote the neighbors.
5. **Draft the pattern line.** Replace every value that should vary with a `{placeholder}` token named after its role (`{name}`, `{column}`, `{value}`, `{path}`, `{owner}`, `{repo}`, etc.). Quote strings the caller types (`"{name}"`) to match the file's quoting convention. Match Gherkin tense and keyword cues: actions are imperative (`I click ...`), assertions are declarative (`the database should ...`, `the file ... should exist`).
6. **Draft the exact recipe.** Spell out the literal tool call with placeholder substitution visible.
   - DB: `{DB_CMD}` placeholder OR both `sqlite3 "$DATABASE_PATH" "<SQL>"` and `psql "$DATABASE_URL" -t -A -c "<SQL>"` with the exact query and the assertion on the result (`> 0`, `= {n}`, `!= ""`).
   - UI: `browser_snapshot` first, then `browser_click` / `browser_drag` / `browser_fill_form` on the returned ref. Do NOT use `browser_evaluate` or `browser_wait_for`. Use `browser_run_code` with an explicit polling loop when a wait is required.
   - Log: local `grep '{text}' $DATA_DIR/logs/server*.log`; remote `az storage file download --share-name logs --path server*.log --dest /tmp/ && grep '{text}' /tmp/server*.log`. Glob `server*.log` to catch rotated files. Fail immediately on 0 matches.
   - FS: local `test -d "{path}"` / `test -f "{path}"` / `grep -l ... "{path}"`; remote `az storage directory exists` / `az storage file exists` / `az storage file download` + grep.
   - Fabric/OneLake: `curl -H "Authorization: Bearer $DFS_BEARER" "https://onelake.dfs.fabric.microsoft.com/{WS}/{LH}/..."`. Resolve WS/LH IDs from the intent row via `{DB_CMD}` beforehand. Fail immediately if `$DFS_BEARER` is unset or HTTP status is not 200.
   - GitHub: `gh api repos/{owner}/{repo}/...` — check `gh auth status` before the first API call in a feature; FAIL immediately on auth failure.
7. **Draft the failure-mode note.** A one-liner stating: no retry on miss, no silent fallback to alternative sources, FAIL immediately on the first miss. This matches the existing convention in `log-assertions.md` and `other-headless-actions.md`.
8. **Draft the `{{RUN_ID}}` example.** Show one concrete Gherkin line calling the pattern with `{{RUN_ID}}` embedded in any data literal the test seeds (e.g. `Then the database should have a domain named "e2e-domain-{{RUN_ID}}"`). Do not tag UI chrome with `{{RUN_ID}}`.
9. **Insert alphabetically** (or into the nearest logical group matching the target file's existing organization — `Given` / `When` / `Then` blocks, or a thematic sub-section like `## Fabric CLI`). If the file's existing entries are not strictly alphabetical, keep the insertion close to the correct alphabetical slot within its block without reordering unrelated entries.
10. **Hand back to the caller.** The caller is whichever skill triggered the handoff (`e2e-adding-scenario`, `e2e-authoring-feature-file`, or `e2e-regenerating-from-guide`). They will re-run their own workflow (re-draft, re-generate, etc.) now that the pattern exists.

## Invariants

| Invariant | Strictness | Rule |
|---|---|---|
| One backend per step | **Hard** | A single step targets exactly one of `ui` / `api` / `db` / `fs` / `log` / `other`. Cross-backend requests are refused and split. |
| Exact tool recipe | **Hard** | The recipe spells out the literal command or MCP call with placeholder substitution. No "use curl somehow" — write the exact invocation. |
| Placeholder pattern | **Hard** | Every value that should vary between scenarios is a `{placeholder}` token. Literals never bake into the pattern line. |
| No retry on miss | **Hard** | Every recipe states FAIL immediately on first miss. No loops around failing assertions, no fallback to a different backend or command. |
| No disallowed tools | **Hard** | The recipe never uses `browser_evaluate` or `browser_wait_for`. Use `browser_run_code` with an explicit polling loop when a wait is required. |
| Dual-dialect for DB | **Hard** | DB recipes use the `{DB_CMD}` placeholder OR document both `sqlite3 "$DATABASE_PATH"` and `psql "$DATABASE_URL"` invocations. Never one dialect only. |
| Environment-aware variants | **Hard** | Log and FS recipes document BOTH the local and remote (`az storage`) variants where applicable. |
| Pattern uniqueness | **Hard** | Near-duplicate synonyms are refused — pointer to the existing pattern only. |
| `{{RUN_ID}}` in data examples | **Hard** | When the pattern's placeholders touch seeded data, the example call embeds `{{RUN_ID}}`. |
| Snapshot-first UI | **Hard** | UI recipes call `browser_snapshot` before any action and use refs from the snapshot. |
| `$DFS_BEARER` pre-minted | **Hard** | Fabric/OneLake recipes reuse `$DFS_BEARER`; never self-mint via `az account get-access-token`. |
| Path hygiene | **Hard** | No hardcoded absolute paths in any recipe or example. Reference `$APP_SRC`, `$DATABASE_PATH`, `$DATA_DIR`, `$DOMAINS_PATH`, `$TMP_DIR` by variable name. |
| Ask-first for narrow patterns | **Hard** | One-feature-only patterns trigger a simplification ask before the entry is emitted. |
| Neighbor-format match | **Hard** | The PROPOSED ENTRY mirrors the target file's existing row format, backticking, and section placement. |

## Handoffs

| Trigger | Hand off to | Resume here? |
|---|---|---|
| Pattern added | caller (`e2e-adding-scenario` / `e2e-authoring-feature-file` / `e2e-regenerating-from-guide`) | No — caller re-runs its own draft / regen now that the pattern exists. |
| User declines the added pattern (prefers simpler scenario) | caller | No — caller rewrites the scenario to existing vocabulary. |
| Cross-backend request | caller | No — caller re-splits the step into two separate steps and may re-invoke this skill for each. |
| Ambiguous wording | caller | No — caller picks a disambiguated wording and may re-invoke this skill. |
| Near-duplicate detected | caller | No — caller updates the scenario to use the existing pattern. |
| Pattern too narrow (one-feature-only), caller picks simplification | caller | No — caller rewrites the scenario. |
| Pattern too narrow, caller insists on bespoke pattern | (proceed — emit the PROPOSED ENTRY) | N/A. |

## Example

**Task:** "The `.feature` I'm drafting needs a step `the database intent in domain \"{domain}\" should have column \"{column}\" containing \"{substring}\"`. `steps/db-assertions.md` already has equality / `not empty` / polling patterns but no substring match."

**Walk-through:**

1. Backend: `db` (references the database, an intent row, a column). Target: `steps/db-assertions.md`.
2. Refusal gates: no cross-backend (pure DB); not ambiguous (clear `LIKE '%{substring}%'` semantic); not a near-duplicate (existing `... equal to "{value}"` is equality, not substring).
3. Reusability: reusable across any scenario that checks a generated text/markdown column for a fragment — clearly not one-feature-only. Proceed.
4. Neighbor format: `db-assertions.md` uses a two-column markdown table with the pattern in backticks on the left and `Bash: {DB_CMD} "<SQL>"` plus an assertion clause on the right. Use `{DB_CMD}`.
5. Pattern line: `the database intent in domain "{domain}" should have column "{column}" containing "{substring}"`.
6. Recipe: `Bash: {DB_CMD} "SELECT count(*) FROM intents WHERE domain_id IN (SELECT id FROM data_domains WHERE name = '{domain}') AND {column} LIKE '%{substring}%';"` and assert result > 0.
7. Failure mode: FAIL immediately if the count is 0. No retry, no widening the `LIKE`.
8. `{{RUN_ID}}` example:

   ```gherkin
   Then the database intent in domain "e2e-domain-{{RUN_ID}}" should have column "description" containing "{{RUN_ID}}"
   ```

9. Insert alphabetically within the `Then` block — immediately after `the database intent in domain "{domain}" should have column "{column}" equal to "{value}"`.

**PLAN**

- **Backend:** `db`
- **Target:** `steps/db-assertions.md`
- **Reusability:** reusable across features that need substring match on intent columns; not a near-duplicate of the existing equality / `not empty` / polling patterns.

**PROPOSED ENTRY**

| Step pattern | Action |
| --- | --- |
| `the database intent in domain "{domain}" should have column "{column}" containing "{substring}"` | `Bash`: `{DB_CMD} "SELECT count(*) FROM intents WHERE domain_id IN (SELECT id FROM data_domains WHERE name = '{domain}') AND {column} LIKE '%{substring}%';"` and assert result > 0 |

**Failure mode:** FAIL immediately on a 0 count. No retry, no relaxing the `LIKE` pattern, no fallback to an equality check.

**Example call:**

```gherkin
Then the database intent in domain "e2e-domain-{{RUN_ID}}" should have column "description" containing "{{RUN_ID}}"
```
