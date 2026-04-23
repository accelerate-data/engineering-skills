---
name: e2e-authoring-feature-file
description: Create a brand-new `.feature` file in a BDD E2E test harness — e.g. "add a new feature file for the billing panel", "cover the Reports area (no file exists yet)". Works from any repo when `E2E_HARNESS_ROOT` points to the harness.
---

# e2e-authoring-feature-file

## Harness context

Resolve these two values before every other step in this skill:

1. **Harness root** — resolve in this order, stopping at the first match:
   1. `$E2E_HARNESS_ROOT` env var → use directly.
   2. CWD — if it contains `features/` and `steps/` subdirectories → use it.
   3. Scan parent directories (up to 3 levels up) for a directory containing `features/` + `steps/` → use the first match.
   4. If filesystem access is available, scan common sibling paths (list `~/Documents/`, `~/projects/`, and similar for a directory containing `features/` + `steps/`).
   5. Still not found → ask the user: "Could not auto-detect the harness root. Set `E2E_HARNESS_ROOT=<path>` and retry."
2. **App source** (`$APP_SRC`) — use `$E2E_APP_SRC` if set and skip the `$DATABASE_PATH` derivation. Otherwise derive from `$DATABASE_PATH` in `{harness_root}/.env` using the HARD GATE at step 4 (which includes auto-discovery before halting).
3. Every file reference in this skill — `features/`, `steps/`, `generate-features.sh`, `.env`, `docs/authoring-features.md`, `npm run test:bdd` — is relative to the resolved harness root.

## When to use

Create a brand-new `features/<cat>/<name>.feature` via the ad-hoc path described in `{harness_root}/docs/authoring-features.md` §1. Triggers:

- User asks for a new `.feature` at a path that does not yet exist.
- User references a product surface with no current BDD coverage at all.
- A failing BDD run surfaces a gap that no existing `.feature` covers.

## When NOT to use

- Target `.feature` file already exists → hand off to `e2e-adding-scenario`; do NOT emit a replacement file.
- The product surface lives under `$APP_SRC/docs/user-guide/**/*.md` and the user wants regenerable, diff-reviewable coverage → hand off to `e2e-regenerating-from-guide`.
- A needed step pattern is missing from `steps/*.md` → emit `# MISSING STEP:` and hand off to `e2e-extending-step-vocabulary`; resume here afterwards.
- The `DATABASE_URL` env var is set (Postgres / remote env) without `DATABASE_PATH` — this skill refuses to author in remote contexts; escalate to the user.

## Output format

Emit exactly two sections, in this order:

1. **PLAN** (H2 or bold heading): prose covering judgment decisions — sibling pick, category-creation confirmation, fixture touches, missing-step handoffs, MAPPINGS warnings, scenario-count rationale, and any redirects. Write PLAN in plain prose using backticks for code-like tokens (paths, step patterns, UI labels). Do not use the Gherkin keywords `Feature:`, `Background:`, or `Scenario:` as section markers inside PLAN — say "feature-file heading", "background block", "scenario block" instead. The Gherkin keywords appear only inside the FILE BLOCK.
2. **FILE BLOCK**: one fenced code block labelled `gherkin` containing the **full** `.feature` file content, starting with `Feature:` on the first line. The caller writes this verbatim to `features/<cat>/<name>.feature`.

### FILE-block rules

See the **Invariants** table below for the enforceable list. Two rules need more space than a table row:

**Teardown scenario (LAST in file).** Removes only this run's artifacts by filtering on `{{RUN_ID}}`. Its body MUST contain a removal action expressed either as `DELETE ... WHERE ... LIKE '%{{RUN_ID}}%'` (DB path) or as `I delete ...` / `I should NOT see ... {{RUN_ID}} ...` (UI path). One checkpoint: DB absence OR UI absence, not both. If the step pattern is missing from `steps/*.md`, emit a `# MISSING STEP:` comment whose body still contains the `DELETE ... WHERE ... {{RUN_ID}}` clause verbatim — the removal action must appear even while the vocabulary gap is open. Stateless surfaces (theme picker, preference toggles) are not exempt: revert via a UI step that asserts the default is restored after clearing `{{RUN_ID}}`-tagged state.

**`{{RUN_ID}}` on data, NOT on chrome.** Every value the test creates, types, or asserts on (fixture rows, field inputs, expected row values) carries `{{RUN_ID}}`, e.g. `"E2E Billing Plan {{RUN_ID}}"`. UI chrome the product already ships (existing button / tab / menu labels like `"Add Data Domain"`, `"Archived"`) stays exactly as rendered — it's shared product text, not per-run test data. Parallel BDD runs rely on this split for isolation.

**Why these constraints** — load `references/authoring-rationale.md` for the full engineering rationale behind each rule.

## Checklist

Do each step in order. Do not skip.

1. **Resolve target path.** Confirm `features/<cat>/<name>.feature` does NOT already exist in the harness root. If it does exist, STOP — emit a PLAN-only reply that refuses to overwrite the existing file and redirects the user to the `e2e-adding-scenario` skill for appending coverage. Do not emit a FILE BLOCK.
2. **Category branch.** If the parent directory `features/<cat>/` does not exist, confirm in PLAN that a brand-new category is justified before `mkdir`-ing it. List the existing categories so the user can reconsider. Do not create the directory silently.
3. **Pick a sibling.** Choose the closest sibling `.feature` from the `{harness_root}/docs/authoring-features.md` §1 Step A table and read it fully. Note its `Feature:` heading style, its `Background:` block (or explicit no-Background comment), its scenario granularity, and its teardown pattern.
4. **Resolve `$APP_SRC` — HARD GATE.** Load `references/app-src-gate.md` and execute it. On halt, the halt notice is your entire output — no PLAN, no FILE BLOCK.
5. **Read source context from `$APP_SRC`.** Explore `$APP_SRC` for the files you need — do NOT assume a specific layout. Projects vary: some use `src/client/`, some `src/` directly, some `app/`. ORMs vary: prisma, drizzle, typeorm. Find UI labels in the frontend tree, API routes in server/router/controller files, DB columns/tables in schema files. If a specific value can't be located after a reasonable search, emit `# LABEL UNVERIFIED: <desc>` per the never-invent rule — do NOT fall back to convention.
6. **Read all `steps/*.md`.** Treat them as the authoritative step vocabulary. Group by backend so you pick the right file for each assertion:
   - UI actions → `ui-actions.md`
   - UI assertions → `ui-assertions.md`
   - API assertions → `api-assertions.md`
   - DB assertions → `db-assertions.md`
   - FS assertions → `fs-assertions.md`
   - Log assertions → `log-assertions.md`
   - Other headless actions → `other-headless-actions.md` / `skill-steps.md`
7. **Assemble the skeleton.**
   - Single-line `Feature:` title.
   - 2-3 line purpose block, indented two spaces.
   - `Background:` copied verbatim from the sibling — unchanged keywords, unchanged order. If the sibling has no Background block, mirror that choice and document why in PLAN.
   - Golden-path scenario matching the user's primary ask.
   - Any additional scenarios the user explicitly asked for. Do not invent coverage the user did not request.
   - Teardown / cleanup scenario as the LAST scenario — always present, always `{{RUN_ID}}`-filtered.
8. **First-pass `# MISSING STEP:` scan.** Before any BDD run, walk every step and confirm it matches a pattern in `steps/*.md`. Any unmatched step is replaced with a `# MISSING STEP: <description>` comment. Note the handoff to `e2e-extending-step-vocabulary` in PLAN with the full list of gaps, and plan to resume at this checklist item once patterns exist.
9. **DB / FS pre-state.** If any scenario asserts pre-seeded state, state in PLAN that `fixtures/<name>.sql` (or matching FS fixture) must contain the seeded rows with `{{RUN_ID}}` in every data literal. Create or extend the fixture as needed — never seed ad-hoc inside the scenario body.
10. **BDD green loop (at runtime) — run now, do not defer.** Immediately after the FILE BLOCK is written to disk, load `references/bdd-run-loop.md` and follow it, substituting `<cat>/<name>` for this feature. Skip if the user explicitly said "don't run BDD", "just produce the file", or "skip validation". At eval-time, stop at step 9.
11. **Report (at runtime).** List the file created, the category (new or existing), scenarios added, fixtures touched, `# MISSING STEP:` handoffs, and the final BDD status. If the user later wants more scenarios in the same file, suggest `e2e-adding-scenario`.

## Invariants

| Invariant | Strictness | Rule |
|---|---|---|
| File starts with `Feature:` | **Hard** | The FILE BLOCK's first non-empty line is `Feature: <single-line title>`. |
| Sibling `Background:` copied verbatim | **Hard** | The Background block matches the sibling's keyword-for-keyword and line-for-line, unless the sibling has no Background (then mirror that choice and justify in PLAN). |
| Explicit teardown scenario | **Hard** | The LAST scenario is a cleanup / teardown scenario whose steps reference `{{RUN_ID}}` in the filter (DB `DELETE ... WHERE ... {{RUN_ID}}` or UI deletion targeted at `{{RUN_ID}}`-tagged rows). |
| `{{RUN_ID}}` tagging | **Hard** | Every data literal the scenario creates, enters, or asserts carries `{{RUN_ID}}`. UI chrome (existing product labels) does not. |
| Step-vocabulary constraint | **Hard** | Every Given/When/Then/And matches a pattern in `steps/*.md` or is replaced by a `# MISSING STEP:` comment. |
| First-pass MISSING STEP scan | **Hard** | The scan happens before any BDD run. `e2e-extending-step-vocabulary` is invoked to close gaps before the scenario is executed. |
| Backend-appropriate step file | **Hard** | DB truth → `db-assertions.md`; UI truth → `ui-assertions.md`; API truth → `api-assertions.md`; FS → `fs-assertions.md`; log → `log-assertions.md`. Do not swap. |
| No expanded source path | **Hard** | Neither FILE BLOCK nor PLAN contains the expanded value of `$DATABASE_PATH` or `$APP_SRC`. Variable names only. |
| No CSS selectors | **Hard** | Step lines use label-based assertions from the vocabulary. `#id` / `.class` selectors are not allowed. |
| No disallowed tool calls | **Hard** | `browser_evaluate` and `browser_wait_for` never appear in the output. |
| Category creation confirmation | **Hard** | A new category directory requires explicit user confirmation before `mkdir`. |
| Refuse to overwrite existing file | **Hard** | If the target path already exists, refuse and redirect to `e2e-adding-scenario`. |
| Scenario ≤ 8 steps | Soft | Prefer short, focused scenarios. Longer is allowed when the user journey demands it. |
| One checkpoint per scenario | **Hard** | Split multi-checkpoint requests. Only exception: paired UI-truth + DB-truth confirming the same write — note the pairing in PLAN. |
| No invented coverage | **Hard** | Only include scenarios the user asked for plus the required golden-path and teardown. Do not pad. |
| Never invent any product surface | **Hard** | Applies to UI labels, routes, API paths, DB tables/columns, file paths, and any other product-shipped identifier. If a specific value cannot be confirmed anywhere under `$APP_SRC` after a reasonable search, emit `# LABEL UNVERIFIED: <short desc>` in the step's quoted-string slot and flag it in PLAN. Do NOT substitute a convention-based guess or a value borrowed from the sibling. The `# LABEL UNVERIFIED:` marker behaves like `# MISSING STEP:` — it signals the human reviewer to verify before running BDD. |
| Source-verification HARD GATE | **Hard** | If step 4's conditions do not pass, emit ONLY the halt notice — no PLAN action items, no FILE BLOCK, no placeholder scenarios. "Inconclusive source" is NOT a signal to proceed by convention; it is a signal to stop. Do NOT check for specific subdirectories — layouts vary. |

## Handoffs

| Trigger | Hand off to | Resume here? |
|---|---|---|
| Target `.feature` file already exists | `e2e-adding-scenario` | No — this skill only authors brand-new files. |
| Product surface is documented at `$APP_SRC/docs/user-guide/**/*.md` and user wants regenerable coverage | `e2e-regenerating-from-guide` | No — guide-path replaces ad-hoc authoring. |
| Any `# MISSING STEP:` in draft | `e2e-extending-step-vocabulary` | Yes — resume at checklist step 8 once patterns exist. |
| User asks for more scenarios in the same file after ship | `e2e-adding-scenario` | N/A — follow-up skill takes over. |
| BDD green for all new scenarios | (report and stop) | N/A — no PR handoff. |
| ≥5 red BDD iterations | escalate to user | N/A. |

## Example

**Task:** "Create `features/settings/billing.feature` covering the Billing panel. Include a golden-path that opens Billing, views the current plan, and a teardown filtered by `{{RUN_ID}}`. The `features/settings/` directory already exists."

**Walk-through:**

1. Target path does not exist — proceed.
2. `features/settings/` exists — no category-creation prompt needed. State this in PLAN for auditability.
3. Sibling pick: `features/settings/domain-crud.feature` (same category). Read it fully.
4. `$E2E_APP_SRC` is not set. Derive `$APP_SRC = dirname(dirname($DATABASE_PATH))` from `{harness_root}/.env`. Verify the `$APP_SRC` directory itself is readable — do NOT check for specific subdirs (layouts vary). Reference by variable name only.
5. Explore `$APP_SRC` for the exact `Billing` / `Plan` labels (grep the frontend tree); locate the schema file if the teardown needs a DB DELETE.
6. Read `steps/*.md`. `ui-actions.md` has `I click the element containing text "{text}"`; `ui-assertions.md` has `I should see text "{text}"`; `db-assertions.md` has a `DELETE FROM {table} WHERE {column} LIKE "%{{RUN_ID}}%"` pattern for teardown.
7. Assemble:

   ```gherkin
   Feature: Billing Settings
     View the current plan and manage billing from the Settings panel.
     Covers the golden-path view and a RUN_ID-scoped cleanup.

     Background:
       Given the app is running at "{{APP_URL}}"
       And I sign in with Microsoft using credentials from env
       When I navigate to "/settings"
       And I click the element containing text "Billing"

     Scenario: View the current plan label on the Billing panel
       When I fill the "Plan Nickname" field with "Plan {{RUN_ID}}"
       And I click the "Save Nickname" button
       Then I should see text "Plan {{RUN_ID}}"

     Scenario: Cleanup - remove test plan nickname
       When I execute SQL "DELETE FROM billing_plans WHERE nickname LIKE '%{{RUN_ID}}%'" against the database
       Then the database should NOT have a billing_plan named "Plan {{RUN_ID}}"
   ```

8. No `# MISSING STEP:` — no handoff needed.
9. No DB pre-state asserted — no fixture change required.
10. Caller writes the file; BDD green loop runs at runtime.
11. Report: "Created `features/settings/billing.feature`. Existing category `settings/`. 2 scenarios (golden-path + teardown). Background copied from `features/settings/domain-crud.feature`. No fixture touches. No step-vocabulary gaps. BDD green on first pass."

**Alternate: target already exists.** If the user asks for a new `features/settings/domain-crud.feature` but that file already exists, the output is PLAN only:

> The file `features/settings/domain-crud.feature` already exists. `e2e-authoring-feature-file` only creates brand-new feature files. To add coverage to the existing file, use the `e2e-adding-scenario` skill — it preserves the existing `Feature:` and `Background:` blocks and appends only new `Scenario:` blocks with `{{RUN_ID}}`-tagged data.

No FILE BLOCK is emitted.

**Alternate: source-verification HARD GATE fails.** User asks to "create `features/settings/billing.feature` covering the Billing panel". You read `{harness_root}/.env`, and `DATABASE_PATH=` is empty. You stop at step 4. The output is the halt notice only — no PLAN action items beyond the halt, no FILE BLOCK:

> Source verification failed: `DATABASE_PATH` is unset or empty in `{harness_root}/.env`, so `$APP_SRC` cannot be derived. Set `DATABASE_PATH` in the harness `.env` so `$APP_SRC` resolves to a readable app source checkout, or set `E2E_APP_SRC` directly. I will not author feature files against unverified source — product labels, routes, and schema must be grounded in the codebase, not guessed.

You do NOT proceed to assemble a skeleton. The halt is the entire response.

## Reference Index

- `references/app-src-gate.md` — source verification gate: `$APP_SRC` derivation, auto-discovery fallback, halt conditions and message
- `references/bdd-run-loop.md` — BDD run loop: command form, polling, red-iteration limit, completion report
- `references/authoring-rationale.md` — engineering rationale behind the FILE-block constraints
