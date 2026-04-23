---
name: e2e-adding-scenario
description: Use when the user asks to add, append, or extend scenarios in an existing `.feature` file in a BDD E2E test harness — e.g. "add a scenario for X to the domain-crud feature", "cover Y in intent-creation.feature", or "the BDD run missed Z in settings/foo.feature". Works from any repo when `E2E_HARNESS_ROOT` points to the harness. Do NOT use for creating a brand-new `.feature` file or for adding step patterns to `steps/*.md`.
---

# e2e-adding-scenario

## Harness context

Resolve these two values before every other step in this skill:

1. **Harness root** — use `$E2E_HARNESS_ROOT` if set. Otherwise treat the current working directory as the harness root. If the CWD does not contain `features/` and `steps/` directories, emit one note: "Tip: set `E2E_HARNESS_ROOT=<path-to-harness>` for cross-repo use." Then continue.
2. **App source** (`$APP_SRC`) — use `$E2E_APP_SRC` if set and skip the `$DATABASE_PATH` derivation. Otherwise derive from `$DATABASE_PATH` in `{harness_root}/.env` using the HARD GATE at step 4 (unchanged logic).
3. Every file reference in this skill — `features/`, `steps/`, `generate-features.sh`, `.env`, `npm run test:bdd` — is relative to the resolved harness root.

## When to use

Append scenarios to an **existing** `features/<cat>/<name>.feature`. Triggers:

- User asks to add a scenario / check / flow to an existing `.feature`.
- User references a specific existing feature file and wants more coverage.
- A failed BDD run surfaces a coverage gap in a file that already exists.

## When NOT to use

- Target `.feature` file does **not** exist → hand off to `e2e-authoring-feature-file`.
- User needs a new `steps/*.md` pattern first → emit `# MISSING STEP:` and hand off to `e2e-extending-step-vocabulary` (resume here after).
- Target file is in `MAPPINGS` in `generate-features.sh` **and** the user picks the guide-edit path → hand off to `e2e-regenerating-from-guide`.
- Running `generate-features.sh`, editing `MAPPINGS`, or authoring a user guide — those belong to `e2e-regenerating-from-guide`.
- Editing `steps/*.md` directly — that belongs to `e2e-extending-step-vocabulary`.

## Output format

Emit exactly two sections, in this order:

1. **PLAN** (H2 or bold heading): prose covering judgment decisions — MAPPINGS check result, any guide-backed warning, fixture touches, missing-step handoffs, sibling-style notes. Write PLAN in plain prose using backticks for code-like tokens (paths, step patterns, scenario names, UI labels). Do not use the Gherkin keywords `Feature:`, `Background:`, or `Scenario:` in PLAN prose — say "feature-file heading", "background block", "scenario block" instead. The Gherkin `Scenario:` keyword appears only inside the APPEND BLOCK.
2. **APPEND BLOCK**: one fenced code block labelled `gherkin` containing **only** the new `Scenario:` blocks to append. The caller pastes this verbatim above any teardown scenario.

### Append-block rules

- Never start a line with `Feature:` — the target file already has one.
- Never restate the target's existing `Background:` block — it is already in place.
- Never invent step text. If the needed pattern is absent from `steps/*.md`, replace the step with a `# MISSING STEP: <what to assert>` comment line and hand off to `e2e-extending-step-vocabulary`.
- Every **data literal** (the values the user types into a field, the names seeded into a fixture, the expected row values the scenario asserts) contains `{{RUN_ID}}` — e.g. `"E2E Domain {{RUN_ID}}"`, never a bare `"Test Domain"`. UI button / menu / tab labels are chrome, not data literals, and stay as the app renders them.
- Never embed the expanded value of `$DATABASE_PATH` or `$APP_SRC` (literal filesystem path) anywhere in the output. Refer to these by their variable names only. Describe derivation abstractly: `"$APP_SRC = dirname(dirname($DATABASE_PATH))"`, not the expanded result.

## Checklist

Do each step in order. Do not skip.

1. **Resolve target.** Confirm `features/<cat>/<name>.feature` exists in the harness root. If missing, STOP and hand off to `e2e-authoring-feature-file`.
2. **Check MAPPINGS.** Grep `MAPPINGS=(` in `generate-features.sh`. If the target appears on the right side of any `"<guide>.md:<feature>.feature"` pair:
   - Warn in PLAN: this file is **guide-backed**; hand-edits will be overwritten when the guide is regenerated.
   - Offer in PLAN: (a) edit the user guide + hand off to `e2e-regenerating-from-guide`, or (b) proceed as a hand-edit (accept overwrite risk).
   - Draft the APPEND BLOCK only if the user picks (b), or if task instructions direct a fallback hand-edit.
3. **Read the target file.** Note its existing `Background:` and sibling scenarios so your new ones match style — granularity, step wording, indentation, quoting — but do NOT restate them.
4. **Resolve `$APP_SRC` — HARD GATE.** If `$E2E_APP_SRC` is set, use it directly and skip this gate. Otherwise: read `{harness_root}/.env` (or `{harness_root}/.env.example` if `.env` is unavailable). Derive `$APP_SRC = dirname(dirname($DATABASE_PATH))`. Reference source paths by variable name only; never write the expanded value.

   **HALT immediately — do not produce any Gherkin, PLAN action items beyond the halt notice, or APPEND BLOCK — if either of these is true:**
   1. `$DATABASE_PATH` is unset, empty, or a blank string in `.env`. (This is the primary gate signal — it is always checkable from `.env` alone, with no disk access.)
   2. You have disk access AND the derived `$APP_SRC` directory is not readable. (Runtime-only check — skip when you do not have tool access to the filesystem.)

   **Do NOT check for specific subdirectories** like `src/client/`, `prisma/schema.prisma`, or `src/server/`. Project layouts vary (some use `src/` flat, some use drizzle instead of prisma, some use `app/` or `lib/`). The gate only confirms that `$APP_SRC` itself is a real readable directory. The agent discovers the actual layout when reading source in step 5; if a specific file you need can't be found, emit `# LABEL UNVERIFIED: <desc>` per the never-invent rule — do NOT halt again.

   When `.env` provides a non-empty `DATABASE_PATH` and you are in a planning-only context with no filesystem access, treat the derivation as provisional and continue — but require the runtime invocation to re-verify condition 2 before `npm run test:bdd` runs.

   When the derived `$APP_SRC` path doesn't exist on disk (e.g. `.env` has a relative path that's valid from the main repo but not from a worktree), the HALT message should tell the user the derived path and ask them to adjust `.env` (or set `E2E_APP_SRC` directly) so `$APP_SRC` resolves. Do NOT ask a clarifying question to proceed — the gate is binary: source readable → proceed; not readable → HALT with guidance.

   On halt, report to the user:

   > "Source verification failed: \<which condition\>. Set `DATABASE_PATH` in `{harness_root}/.env` so `$APP_SRC` resolves to a readable app source checkout, or set `E2E_APP_SRC` directly. I will not author scenarios against unverified source — product labels, routes, and schema must be grounded in the codebase, not guessed."

   Do NOT proceed. Do NOT assume labels "by convention" from siblings. Do NOT emit an APPEND BLOCK with placeholder labels. A sibling `.feature` uses one vocabulary of labels; the target scenario may need labels that do not appear in any sibling, and the only grounded source for those is the real product tree under `$APP_SRC`.
5. **Read source context from `$APP_SRC`.** Explore `$APP_SRC` for the files you need — do NOT assume a specific layout. Projects vary: some use `src/client/`, some use `src/` directly, some use `app/` or `components/`. ORMs vary: prisma, drizzle, typeorm. Find:
   - **UI labels** — search the frontend tree (grep for a known sibling label first to locate the right directory, then search near that for the label you need).
   - **API routes** — search server/router/controller files for route definitions.
   - **DB columns/tables** — search for schema files (`schema.prisma`, `schema.ts` for drizzle, `models/*.py`, etc.).

   If a specific file or label can't be located after a reasonable search, emit `# LABEL UNVERIFIED: <desc>` in the step slot per the never-invent rule — do NOT fall back to convention.
6. **Read all `steps/*.md`.** Treat them as the authoritative vocabulary. Group by backend so you pick the right file for each assertion:
   - UI actions → `ui-actions.md`
   - UI assertions → `ui-assertions.md`
   - API assertions → `api-assertions.md`
   - DB assertions → `db-assertions.md`
   - FS assertions → `fs-assertions.md`
   - Log assertions → `log-assertions.md`
   - Other headless actions → `other-headless-actions.md` / `skill-steps.md`
7. **Draft scenarios.**
   - One user-observable checkpoint per scenario. Prefer a single `Then` at the end. Split multi-checkpoint requests into multiple scenarios; the only allowed exception is a UI-truth + DB-truth pair confirming the same write (note the pairing in PLAN).
   - Tag every data literal with `{{RUN_ID}}`. UI chrome stays as the app renders it.
   - Pick the backend-appropriate step file for each assertion: DB-truth from `db-assertions.md`, UI-truth from `ui-assertions.md`, API-truth from `api-assertions.md`. Do not paper over a DB check with a UI-only check.
   - Respect environment splits: use `sqlite3 "$DATABASE_PATH"` locally, `psql "$DATABASE_URL"` remotely; the step vocabulary abstracts this — do not inline dialects.
   - If a needed step pattern is missing, emit `# MISSING STEP: <description>` and continue.
   - Every scenario sets up its own prerequisites — through UI steps or via `fixtures/<name>.sql` seeding. Do not rely on state left by a sibling scenario.
8. **Handle missing steps.** If the draft contains any `# MISSING STEP:` comments, note the handoff in PLAN to `e2e-extending-step-vocabulary` with the list of gaps, and plan to resume at step 7 once the patterns exist.
9. **Handle DB / FS pre-state.** If any scenario asserts pre-existing state, state in PLAN that `fixtures/<name>.sql` (or matching FS fixture) must contain the seeded rows with `{{RUN_ID}}` in every data literal. Create or extend the fixture as needed — never seed ad-hoc inside the scenario body.
10. **Append, do not replace.** The APPEND BLOCK is positioned above any teardown / cleanup scenario in the target file. Do **not** delete, weaken, or rewrite existing assertions to make the file green. If an existing assertion is failing, refuse in PLAN and escalate to the user — "fix by deletion" is forbidden.
11. **BDD green loop (at runtime) — run now, do not defer.** Immediately after the APPEND BLOCK is written to disk, invoke BDD and monitor it:

    - **Command form (critical):** `npm run test:bdd -- <cat>/<name> > /tmp/bdd-<cat>-<name>.log 2>&1 &` in the background (run from the harness root), OR run via the runtime's `run_in_background` option — but in both cases redirect directly to a log file. Do NOT use `| tail -N` or any other pipe on the command — pipes buffer until the whole pipeline exits, which can make a backgrounded invocation look silent for many minutes. A direct `> file 2>&1` redirect captures output line-by-line as BDD emits it.
    - **Poll progress every ~5 minutes** while it runs. Use `wc -l /tmp/bdd-<cat>-<name>.log && tail -40 /tmp/bdd-<cat>-<name>.log` to report current scenario count and the last-seen step. A BDD run can take 5–20+ min depending on scenario count; do not sit silently. If the log hasn't grown between polls, check whether the process is still alive (`ps aux | grep test:bdd`).
    - **Exception:** if the user explicitly said *"don't run BDD"*, *"just produce the scenario"*, or *"skip validation"*, respect that and stop after the APPEND BLOCK.
    - **On each red result:** diagnose from the log → fix the scenario (without weakening assertions) → rerun. After **5 red iterations**, stop and escalate to the user with the last failure output.
    - **On completion:** report final pass/fail count, any fixture or step-vocabulary gaps encountered, and which log file holds the full output.
12. **Report (at runtime).** List scenarios added, fixtures touched, `# MISSING STEP:` handoffs, and the final BDD status. Do not raise a PR.

## Invariants

| Invariant | Strictness | Rule |
|---|---|---|
| `{{RUN_ID}}` tagging | **Hard** | Every data literal in the APPEND BLOCK and in any fixture touched contains `{{RUN_ID}}`. |
| Step-vocabulary constraint | **Hard** | Every Given/When/Then/And matches a pattern in `steps/*.md` or is replaced by a `# MISSING STEP:` comment. |
| No re-emitted `Feature:` / `Background:` | **Hard** | The APPEND BLOCK never contains a `Feature:` line and never restates the existing `Background:`. |
| Backend-appropriate step file | **Hard** | DB truth → `db-assertions.md`; UI truth → `ui-assertions.md`; API truth → `api-assertions.md`; FS → `fs-assertions.md`; log → `log-assertions.md`. Do not swap. |
| Environment awareness | **Hard** | Use `$DATABASE_PATH` / `$DATABASE_URL` via vocabulary; never hardcode paths or SQL dialects. |
| No expanded source path in output | **Hard** | Neither APPEND BLOCK nor PLAN contains the literal expanded value of `$DATABASE_PATH` or `$APP_SRC`. Variable names only. |
| No "fix by deletion" | **Hard** | Never remove an existing assertion to turn CI green. Escalate instead. |
| Scenario ≤8 steps | Soft | Prefer short, focused scenarios. Longer is allowed when the user journey demands it. |
| One checkpoint per scenario | **Hard** | Split multi-checkpoint requests. Only exception: paired UI-truth + DB-truth confirming the same write — note the pairing in PLAN. |
| Scenario independence | **Hard** | Every new scenario sets up its own prerequisites (UI or fixture). No cross-scenario state. |
| Never invent any product surface | **Hard** | Applies to UI labels, routes, API paths, DB tables/columns, file paths, and any other product-shipped identifier. If a specific value cannot be confirmed anywhere under `$APP_SRC` after a reasonable search, emit `# LABEL UNVERIFIED: <short desc>` in the step's quoted-string slot and flag it in PLAN. Do NOT substitute a convention-based guess or a label borrowed from a sibling scenario that does not use that label. The `# LABEL UNVERIFIED:` marker behaves like `# MISSING STEP:` — it signals the human reviewer to verify before running BDD. |
| Source-verification HARD GATE | **Hard** | If step 4's conditions do not all pass, emit ONLY the halt notice — no PLAN action items, no APPEND BLOCK, no placeholder scenarios. "Inconclusive source" is NOT a signal to proceed by convention; it is a signal to stop. |

## Handoffs

| Trigger | Hand off to | Resume here? |
|---|---|---|
| Target `.feature` file missing | `e2e-authoring-feature-file` | No — authoring owns the whole file. |
| Target is in `MAPPINGS` and user picks guide-edit | `e2e-regenerating-from-guide` | No — guide-edit path replaces hand-edit. |
| Any `# MISSING STEP:` in draft | `e2e-extending-step-vocabulary` | Yes — resume at checklist step 7 with patterns available. |
| BDD green for all new scenarios | (report and stop) | N/A — no PR handoff. |
| ≥5 red BDD iterations | escalate to user | N/A. |

## Example

**Task:** "Append a scenario to `features/settings/domain-crud.feature` that archives a domain and verifies the Archived tab shows it."

**Walk-through:**

1. Target exists — proceed.
2. `MAPPINGS` contains the `settings/domains.md → settings/domain-crud.feature` pair → the file is guide-backed. PLAN warns that hand-edits will be overwritten next time the guide is regenerated, and offers (a) edit the guide + hand off, or (b) proceed as hand-edit. User picks (b).
3. Read `domain-crud.feature` — note its `Background:` and existing scenarios; do NOT restate them in the APPEND BLOCK.
4. `$E2E_APP_SRC` is not set. Derive `$APP_SRC = dirname(dirname($DATABASE_PATH))` from `{harness_root}/.env`. Verify the `$APP_SRC` directory itself is readable — do NOT check for specific subdirectories (layouts vary). Reference paths by variable name only.
5. Explore `$APP_SRC` to find where UI labels, routes, and schema live. For this project: grep the frontend tree for the exact label `Archived` and the archive icon; locate the schema file and verify the `data_domains` archived column if a DB assertion is wanted.
6. Read `steps/*.md`. `ui-actions.md` has `I click the "{label}" icon button`; `ui-assertions.md` has `I should see text "{text}"`.
7. Draft the APPEND BLOCK:

   ```gherkin
   Scenario: Archive a domain and verify it appears under Archived
     When I click the "Add Data Domain" button
     And I fill the "Name" field with "Archive Flow {{RUN_ID}}"
     And I click the "Create Domain" button
     When I hover over the element containing text "Archive Flow {{RUN_ID}}"
     And I click the "Archive" icon button
     And I click the "Archived" button
     Then I should see text "Archive Flow {{RUN_ID}}"
   ```

   The typed value `"Archive Flow {{RUN_ID}}"` carries `{{RUN_ID}}`. Every step matches `steps/*.md`. One checkpoint. No `Feature:` line. No `Background:` restated. No expanded filesystem path. UI chrome (`Add Data Domain`, `Archive`, `Archived`) stays as the app renders it.

8. No `# MISSING STEP:` — no handoff needed.
9. No DB pre-state asserted — no fixture change.
10. Caller inserts the APPEND BLOCK above any teardown scenario.
11. `npm run test:bdd -- settings/domain-crud` (run from harness root) — pass or iterate up to 5 times.
12. Report: "Added 1 scenario to `features/settings/domain-crud.feature`. Warned that the file is guide-backed; user chose hand-edit. BDD green on first pass. No fixture changes. No step-vocabulary gaps."

**Alternate: a missing step.** If the user asked to verify "the Archive icon has a bold border", `ui-assertions.md` has no pattern for that. Replace the step with:

```gherkin
    # MISSING STEP: verify the "Archive" icon renders with a bold/selected border
```

Hand off to `e2e-extending-step-vocabulary` with the gap; resume at step 7 once it returns.

**Alternate: source-verification HARD GATE fails.** User asks to "add a scenario that clicks the Refresh button to reload the domain list". You read `{harness_root}/.env`, and `DATABASE_PATH=` is empty. You stop at step 4. The output is the halt notice only — no PLAN action items, no APPEND BLOCK:

> Source verification failed: `DATABASE_PATH` is unset or empty in `{harness_root}/.env`, so `$APP_SRC` cannot be derived. Set `DATABASE_PATH` in the harness `.env` so `$APP_SRC` resolves to a readable app source checkout, or set `E2E_APP_SRC` directly. I will not author scenarios against unverified source — product labels, routes, and schema must be grounded in the codebase, not guessed.

You do NOT proceed to draft the scenario. You do NOT borrow a "Refresh" label from a sibling file "by convention". The halt is the entire response.

**Alternate: unverifiable UI label.** Source verification passes, but the user asks for an action on a UI element whose label you cannot confirm in `$APP_SRC` — e.g. "click the Refresh button in `DomainsPanel.tsx`", and a grep of the frontend tree for `Refresh` returns no match inside that file or any component it renders. Do NOT guess the label from sibling scenarios. Emit `# LABEL UNVERIFIED:` instead:

```gherkin
    # LABEL UNVERIFIED: reload trigger on the Domains panel — no button/icon labelled "Refresh" found in $APP_SRC; human must confirm the actual label before running BDD
    And I click the "<UNVERIFIED>" icon button
```

Flag this in PLAN: "PLAN includes a `# LABEL UNVERIFIED:` marker — the reviewer must resolve the label against the product before this scenario can run. The Refresh button may not exist in the product at all; if so, the scenario should be dropped rather than re-labelled."
