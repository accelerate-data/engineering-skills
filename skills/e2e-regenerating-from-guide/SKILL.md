---
name: e2e-regenerating-from-guide
description: Use when a product surface is documented at `$APP_SRC/docs/user-guide/**/*.md` and the user wants regenerable, diff-reviewable BDD `.feature` coverage — e.g. "regenerate features/settings/domain-crud.feature from the guide", "the Notifications guide changed, refresh the .feature", "add a guide-backed feature for the Plugins panel". Works from any repo when `E2E_HARNESS_ROOT` points to the harness. Do NOT use for hand-written auth / workflow features (use `e2e-authoring-feature-file`), for appending a quick scenario to an existing file (use `e2e-adding-scenario`), or for adding a step pattern to `steps/*.md` (use `e2e-extending-step-vocabulary`).
---

# e2e-regenerating-from-guide

## Harness context

Resolve these two values before every other step in this skill:

1. **Harness root** — use `$E2E_HARNESS_ROOT` if set. Otherwise treat the current working directory as the harness root. If the CWD does not contain `features/` and `steps/` directories, emit one note: "Tip: set `E2E_HARNESS_ROOT=<path-to-harness>` for cross-repo use." Then continue.
2. **App source** (`$APP_SRC`) — use `$E2E_APP_SRC` if set and skip the `$DATABASE_PATH` derivation. Otherwise derive from `$DATABASE_PATH` in `{harness_root}/.env` using the HARD GATE at step 1 (unchanged logic).
3. Every file reference in this skill — `features/`, `steps/`, `generate-features.sh`, `.env` — is relative to the resolved harness root. The user guide path `$APP_SRC/docs/user-guide/**/*.md` is relative to the resolved app source root.

## When to use

Regenerate a `.feature` file from its user-guide source page. Triggers:

- User guide page at `$APP_SRC/docs/user-guide/<area>/<topic>.md` has changed and the paired `.feature` file needs to catch up.
- A new guide-backed surface has no `.feature` yet and needs a first-time regen (create mode).
- The user wants diff-reviewable, regenerable coverage instead of a hand-authored file.

## When NOT to use

- The guide page does not exist — halt and offer `doc-skills:write-user-guide` (if installed) or `e2e-authoring-feature-file` for the hand-edit path. Do NOT invoke `./generate-features.sh` without a guide.
- The user wants to append one or a few scenarios to an existing `.feature` — redirect to `e2e-adding-scenario` with an explicit regen-overwrite warning (hand-edits on a guide-backed file are lost on the next regen).
- The target surface has no guide and is not a candidate for one (auth, workflow, smoke) — hand off to `e2e-authoring-feature-file`.
- A needed step pattern is missing from `steps/*.md` (the generator emitted `# MISSING STEP:` comments) — hand off to `e2e-extending-step-vocabulary` FIRST, then re-run `./generate-features.sh`. Only after the vocabulary is clean does the BDD green loop run.

## Output format

Emit a PLAN section (no FILE BLOCK — this skill does not author Gherkin directly; `./generate-features.sh` writes the file). The PLAN has four parts, in this order:

1. **Classification** — state the mode (`CREATE` or `UPDATE`) with a one-line reason:
   - `CREATE`: target `.feature` does NOT exist (MAPPINGS entry may or may not exist).
   - `UPDATE`: target `.feature` exists AND MAPPINGS already contains the pair.
2. **MAPPINGS state** — quote the relevant line(s). If the pair is missing, state the exact line to INSERT and the alphabetical slot it goes into (between which two existing entries). Commit the `generate-features.sh` edit as a SEPARATE commit BEFORE regen so reviewers can see the MAPPINGS change in isolation.
3. **Regen command** — the literal `./generate-features.sh <area>/<topic>.md` invocation (run from the harness root). Use the guide path (first half of the MAPPINGS pair), never the feature path.
4. **Diff review template** — after regen returns, `git diff features/<area>/<name>.feature` (or `git status` for create mode). Summarize scenarios added / changed / removed. Dropped scenarios are called out explicitly and require user confirmation before the regen commit lands.

Write the PLAN in plain prose with backticks for code-like tokens (paths, commands, scenario names, UI labels). Do not emit a full Gherkin file — the generator owns that.

### Why these constraints

- **`MAPPINGS` alphabetical + separate commit** — the file is hand-maintained and scanned visually; alphabetical order keeps review cheap. A MAPPINGS-only commit makes the guide→feature pairing auditable without the generated-Gherkin diff drowning it out.
- **Guide is the source of truth for label-based assertions** — the guide lists the exact product labels a scenario asserts on. A label mismatch between guide and product UI means the guide is wrong (or the product changed). Fixing it in the `.feature` would be silently overwritten on the next regen; fixing it in the guide persists and propagates.
- **Diff review is mandatory in update mode** — the generator is an LLM, so each regen is a new draft. Without a diff review, dropped scenarios or silently-widened assertions ship without scrutiny.
- **`# MISSING STEP:` handoff precedes BDD** — BDD runs cost Playwright time; running against known-bad Gherkin wastes it. Close vocabulary gaps first, regen clean, then run.
- **Guide-backed append request redirects to `e2e-adding-scenario`** — this skill owns full-file regens, not per-scenario appends. The redirect preserves the regen-overwrite warning that any hand-edit on a guide-backed file needs.

## Checklist

Do each step in order. Do not skip.

1. **Resolve `$APP_SRC` — HARD GATE.** If `$E2E_APP_SRC` is set, use it directly and skip this gate. Otherwise: read `{harness_root}/.env` (or `{harness_root}/.env.example` only if `.env` is absent). Derive `$APP_SRC = dirname(dirname($DATABASE_PATH))`. Reference paths by variable name only — never expand the literal in output.

   **HALT immediately — produce ONLY the halt notice below; do NOT write a PLAN, a MAPPINGS edit, or any `./generate-features.sh` invocation — if ANY of these is true:**
   1. `$DATABASE_PATH` is unset, empty, a blank string, or commented-out in `.env`. Check: grep for an uncommented `DATABASE_PATH=<non-empty>` line; absence = HALT. **This gate is iron-clad** — it requires only reading the `.env` content, no filesystem access needed. "Planning-only context" or "evaluation context" is NOT a license to skip this gate. No `DATABASE_PATH` in the `.env` input → HALT.
   2. You have filesystem access AND the derived `$APP_SRC` directory is not readable.

   **Do NOT check for specific subdirectories** like `src/client/`, `prisma/schema.prisma`, or `docs/user-guide/`. Project layouts vary. The gate only confirms that `$APP_SRC` itself is a real readable directory. The guide path (step 2) is verified separately.

   Gate 2 only applies when you have tool access to read the filesystem. In planning-only contexts with no filesystem access and a valid `.env`, treat the derivation as provisional and continue — but emit a reviewer note that gate 2 must be re-verified at runtime before `./generate-features.sh` runs.

   When the derived `$APP_SRC` path doesn't exist on disk, the HALT message should tell the user the derived path and ask them to adjust `.env` (or set `E2E_APP_SRC` directly) so `$APP_SRC` resolves. Do NOT ask a clarifying question to proceed — the gate is binary: source readable → proceed; not readable → HALT with guidance.

   If `DATABASE_URL` is set without `DATABASE_PATH`, refuse (remote env) and escalate — distinct condition, still HALT.

   On HARD-GATE halt, produce ONLY:

   > "Source verification failed: \<which condition\>. Set `DATABASE_PATH` in `{harness_root}/.env` so `$APP_SRC` resolves to a readable app source checkout, or set `E2E_APP_SRC` directly. I will not plan a regeneration against unverified source — the guide path itself lives under `$APP_SRC/docs/user-guide/**`, and the generator reads product source for label grounding. Both require a resolved `$APP_SRC`."

   Emit the halt notice and STOP. Do not follow it with a PLAN, a MAPPINGS insertion, a `./generate-features.sh` command, or a diff-review template.
2. **Confirm the guide exists** at `$APP_SRC/docs/user-guide/<area>/<topic>.md`. If it does NOT exist, STOP and offer the user two branches: (a) hand off to `doc-skills:write-user-guide` to author the guide first, or (b) hand off to `e2e-authoring-feature-file` for the hand-edit path. Do NOT invoke `./generate-features.sh` without a guide.
3. **Check `MAPPINGS`.** Grep `MAPPINGS=(` in `{harness_root}/generate-features.sh` for a line matching the guide path. Report mode:
   - Pair present AND target `.feature` exists → `UPDATE` mode.
   - Pair present AND target `.feature` absent → `UPDATE` mode with create-on-disk (rare; still a regen).
   - Pair absent → `CREATE` mode; INSERT the `"<area>/<topic>.md:<cat>/<name>.feature"` line ALPHABETICALLY into the MAPPINGS array (between the two existing entries that bracket it). Commit the `generate-features.sh` edit as a SEPARATE commit with a message like `chore(features): map <area>/<topic>.md → <cat>/<name>.feature` BEFORE regen.
4. **Run `./generate-features.sh <area>/<topic>.md`** (from the harness root). Use the guide path (left side of the MAPPINGS pair). The script writes the `.feature` file directly. Capture stdout for the MISSING-STEP log.
5. **Review the diff.**
   - Update mode: `git diff features/<cat>/<name>.feature`. Summarize scenarios ADDED, CHANGED (show the before / after of the assertion), and REMOVED. Dropped scenarios require explicit user confirmation before the regen commit lands — the skill does not silently ship removals.
   - Create mode: `git status` shows the new file; summarize the scenarios the generator wrote.
6. **Handle `# MISSING STEP:` comments.** If the regenerated `.feature` contains any `# MISSING STEP:` lines, STOP the BDD loop and hand off to `e2e-extending-step-vocabulary` with the list of gaps. Once the vocabulary is extended, re-run step 4 (`./generate-features.sh <area>/<topic>.md`) so the regenerated file is clean. Only then proceed to step 7.
7. **BDD green loop (at runtime).** Run `npm run test:bdd -- <cat>/<name>` (from the harness root) up to **5 iterations**. Classify each red result:
   - **Label mismatch** (guide vs. product UI) → edit `$APP_SRC/docs/user-guide/<area>/<topic>.md` to use the correct label, then re-run step 4 (`./generate-features.sh`). Do NOT hand-edit the `.feature` — the fix is in the guide.
   - **Harness failure** (flake, timing, missing fixture) → hand-edit the `.feature` or add fixture rows, and document the hand-edit in a `# HAND-EDIT:` header comment so future regens can preserve it (generator prompt respects those).
   - After 5 red iterations, escalate to the user.
8. **Report.** List the guide processed, mode, MAPPINGS state (unchanged vs. inserted), scenarios added / changed / removed, `# MISSING STEP:` handoffs, hand-edits documented, and final BDD status.

## Invariants

| Invariant | Strictness | Rule |
|---|---|---|
| `MAPPINGS` alphabetical | **Hard** | New pairs insert into the alphabetical slot; never append to the end or prepend to the top. |
| One guide → one feature | **Hard** | A guide page maps to exactly one `.feature` file. No fan-out, no fan-in. |
| Guide non-empty before regen | **Hard** | If the guide page is empty or missing, STOP — do not invoke `./generate-features.sh`. |
| `MAPPINGS` edit in separate commit | **Hard** | The `generate-features.sh` edit that adds a new pair lands in its own commit BEFORE the regeneration commit. |
| Update-mode diff review mandatory | **Hard** | `git diff` review is emitted before the regen commit lands; dropped scenarios require explicit user confirmation. |
| Label fixes route to guide | **Hard** | Label mismatches between guide and product UI are fixed by editing the guide and re-running `./generate-features.sh` — never by hand-editing the `.feature`. |
| `$APP_SRC` derivation | **Hard** | Paths are referenced by variable name (`$APP_SRC`, `$DATABASE_PATH`). No literal hardcoded path ever appears in the output. |
| `# MISSING STEP:` handoff precedes BDD | **Hard** | A BDD run never happens against a file containing `# MISSING STEP:`. Extend vocabulary first, re-regen, then run. |
| Append requests redirect | **Hard** | Append-to-guide-backed-file requests redirect to `e2e-adding-scenario` with an explicit regen-overwrite warning. |
| Never invent any product surface | **Hard** | Applies to UI labels, routes, API paths, DB tables/columns, file paths, and any other product-shipped identifier. If any of these cannot be confirmed anywhere under `$APP_SRC` after a reasonable search, emit `# LABEL UNVERIFIED: <short desc>` in PLAN and surface it as a reviewer action item. Do NOT substitute a convention-based guess. Fixes on guide-backed files route to editing the guide — not to the `.feature` and not to invented values. |
| Source-verification HARD GATE | **Hard** | If step 1's conditions do not pass, emit ONLY the halt notice — no `./generate-features.sh` invocation, no MAPPINGS edit, no diff-review template. "Inconclusive source" is NOT a signal to proceed by convention; it is a signal to stop. Do NOT check for specific subdirectories — layouts vary. |

## Handoffs

| Trigger | Hand off to | Resume here? |
|---|---|---|
| Guide page does not exist | `doc-skills:write-user-guide` (if installed) or `e2e-authoring-feature-file` | No — this skill requires a guide. |
| `# MISSING STEP:` in regenerated output | `e2e-extending-step-vocabulary` | Yes — re-run `./generate-features.sh` after vocabulary is extended, then proceed to BDD. |
| User wants to append a scenario to a guide-backed file | `e2e-adding-scenario` (with regen-overwrite warning) | No — append is a different skill. |
| Surface has no guide and is not a candidate for one (auth, workflow) | `e2e-authoring-feature-file` | No — hand-edit path replaces regen path. |
| BDD green | (report and stop) | N/A — no PR handoff. |
| ≥5 red BDD iterations | escalate to user | N/A. |

## Example

**Task:** "The settings/notifications.md guide just landed. Regenerate features/settings/notifications.feature from it."

**Walk-through:**

1. `$E2E_APP_SRC` is not set. Derive `$APP_SRC = dirname(dirname($DATABASE_PATH))` from `{harness_root}/.env`. Verify the `$APP_SRC` directory itself is readable — do NOT check for specific subdirs (layouts vary). Reference paths by variable name only.
2. Confirm the guide exists at `$APP_SRC/docs/user-guide/settings/notifications.md`. It does — proceed.
3. Grep `MAPPINGS=(` in `{harness_root}/generate-features.sh`. No pair for `settings/notifications.md` — this is CREATE mode. Insert the new pair into its alphabetical slot among the `settings/` entries. Commit separately:

   ```
   chore(features): map settings/notifications.md → settings/notifications.feature
   ```

4. Run `./generate-features.sh settings/notifications.md` from the harness root. The script writes `features/settings/notifications.feature`.
5. Diff review (`git status` — the file is new):
   - Added: `View the Digest Frequency dropdown options`, `Connect a Slack workspace via OAuth`, `Send a test alert to the selected channel`, `Disconnect Slack with confirmation dialog`.
   - Changed: (none — create mode.)
   - Removed: (none — create mode.)
6. No `# MISSING STEP:` comments — skip the vocabulary handoff.
7. Run `npm run test:bdd -- settings/notifications` from the harness root. BDD passes on first iteration.
8. Report: "Guide processed: `settings/notifications.md`. Mode: CREATE. MAPPINGS: inserted `settings/notifications.md:settings/notifications.feature` (alphabetical, separate commit). Scenarios: 4 added, 0 changed, 0 removed. No vocabulary gaps. BDD green on first pass."

**Alternate: append request on a guide-backed file.** If the user asks to "quickly append one scenario to `features/settings/domain-crud.feature`", this skill REDIRECTS to `e2e-adding-scenario` with an explicit warning:

> `features/settings/domain-crud.feature` is guide-backed (MAPPINGS: `settings/domains.md:settings/domain-crud.feature`). Any hand-appended scenario will be OVERWRITTEN on the next `./generate-features.sh settings/domains.md` run. If the new scenario belongs in the guide, edit `$APP_SRC/docs/user-guide/settings/domains.md` and regenerate. If it belongs only in the test harness (e.g. a flake-guard), use `e2e-adding-scenario` and mark it with a `# HAND-EDIT:` header so the regen preserves it.

No `./generate-features.sh` invocation in this branch — append is `e2e-adding-scenario`'s job.
