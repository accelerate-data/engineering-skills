# Sheet-Driven Target Repos for authoring-flow-spec — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the hardcoded `{studio, skill-builder, domain-cicd, migration-utility}` whitelist from the `authoring-flow-spec` skill and its surrounding artifacts. The skill must derive the legitimate target-repo set at runtime from column C of the User-Flows-Details Sheet, so adding or renaming a target repo only requires a Sheet edit — no skill, command, or doc change.

**Architecture:** Single source of truth is Sheet column C (`repo`). A new `references/sheet-interop.md` recipe returns the unique non-empty repo names. Phase 0 of the skill calls that recipe once per invocation, caches the result in working memory, and uses it for both (a) the precondition guard ("are we in a recognized target repo?") and (b) the Phase 3 alignment check ("does the current repo match the row's column C?"). Comparisons are case-insensitive after trimming. An empty result set is a hard abort. The hardcoded list is removed from `SKILL.md`, `commands/author-flow-spec.md`, the two reference files, the design spec, and the plan file. Evals are extended to assert the new behavior.

**Tech Stack:** Markdown (skill, command, references, design, plan), Bash + `gws` CLI (Sheet column-C fetch), Promptfoo YAML packages and JSON-shaped prompt schemas under `tests/evals/`, Node.js (`tests/evals/scripts/`) for any deterministic gate work, `npm run eval:coverage` and `npm run eval:codex-compatibility` for repo-wide gates.

---

## File Structure

| File | Responsibility |
|---|---|
| `skills/authoring-flow-spec/references/sheet-interop.md` | Add §4 "List unique target repos from column C" with the exact `gws` recipe and filter rules |
| `skills/authoring-flow-spec/SKILL.md` | Drop the hardcoded list from Prerequisites, Phase 0, and Safety rails; route to the new resolver; describe caching, case/whitespace handling, empty-Sheet abort |
| `commands/author-flow-spec.md` | Drop the hardcoded list from the "What this does" enumeration; defer to the Sheet-driven check |
| `skills/authoring-flow-spec/references/flow-spec-template.md` | Replace the parenthesized four-repo list with "per Sheet column C" in lines 16 and 173 |
| `skills/authoring-flow-spec/references/flow-spec-template-rationalization.md` | Replace the line 114 enumeration with a Sheet-canonical phrasing; allow a non-normative aside if needed |
| `docs/design/2026-04-24-authoring-flow-spec-design.md` | Update lines 18–19, 104–105, 220, 481, 526–527, 566, 692 to describe the dynamic resolver and caching |
| `docs/plan/2026-04-24-authoring-flow-spec.md` | Update step prose at lines 274–275, 766, 783, 974, 1058–1059, 1594–1595 (and any other surviving four-repo references) so the historical plan is consistent with the new behavior |
| `tests/evals/prompts/skill-authoring-flow-spec.txt` | Add new boolean output keys for the dynamic-resolver behaviors |
| `tests/evals/packages/authoring-flow-spec/skill-authoring-flow-spec.yaml` | Add a new "dynamic target-repo resolution" test scenario; extend the existing preconditions scenario with the new `expect_*` vars |
| `tests/evals/assertions/check-authoring-flow-spec-contract.js` | No code change expected — the assertion auto-iterates `expect_*`. Touch only if a new assertion shape is needed |
| `repo-map.json` | Update the `authoring-flow-spec` entry note if any structural fact changes (likely a one-line description tweak) |
| `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` | Bump version together (per AGENTS.md), since skill behavior is changing |

---

## Open Decisions Already Confirmed

The following were confirmed in the planning thread before this file was written:

1. **Cache scope:** fetch column C **once per skill invocation** (Phase 0); reuse the cached set for Phase 3 alignment.
2. **Empty-Sheet behavior:** if the resolver returns zero valid repo rows, **hard-abort** with a "Sheet column C is empty or drifted" message. The same Sheet is the source of truth for canonical-ID lookup, so proceeding makes no sense.
3. **Comparison semantics:** trim whitespace and case-fold both sides when comparing the current repo (parsed from `git remote get-url origin`) against Sheet values. Preserve original casing in user-facing messages.

---

## Task 1: Add the Sheet column-C resolver to `references/sheet-interop.md`

**Files:**

- Modify: `skills/authoring-flow-spec/references/sheet-interop.md`

- [ ] **Step 1: Add §4 "List unique target repos from column C"**

Append a new section after §3 (auth check). The recipe:

```bash
gws sheets spreadsheets values get --params \
  '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!C2:C"}' \
  --format csv \
  | tail -n +1 \
  | tr -d '\r' \
  | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' \
  | sort -u \
  | grep -Ev '^$|^#N/A$|^pending( |$)'
```

Document the rules:

- The skill consumes this list as the canonical set of allowed target repos.
- Comparisons are case-insensitive after trimming. Sheet values may include trailing spaces; the consuming code must trim before compare.
- Cells equal to `#N/A`, empty, or starting with `pending` (e.g., `pending repo assignment`) are filtered out.
- The skill calls this exactly **once per invocation** in Phase 0 and reuses the result for Phase 3.

- [ ] **Step 2: Add a "Failure modes" sub-section**

Document:

- Resolver returns zero rows → hard-abort: *"Sheet column C is empty or has drifted. Verify the User-Flows-Details schema before retrying."*
- `gws` exits non-zero → fall through to the existing auth-check failure path (already documented in §3).

- [ ] **Step 3: Update the file's header bullets**

Edit the "Columns read by the skill" line to clarify that column C is now read for two distinct purposes: per-row target-repo extraction *and* the unique-repo set used by the Phase 0 guard.

---

## Task 2: Update `SKILL.md` to use the dynamic resolver

**Files:**

- Modify: `skills/authoring-flow-spec/SKILL.md`

- [ ] **Step 1: Rewrite the Prerequisites bullet (line 38–39 area)**

Replace:

> Current working directory is inside a git checkout of one of the four target repos: `studio`, `skill-builder`, `domain-cicd`, `migration-utility`.

With:

> Current working directory is inside a git checkout of one of the target repos listed in column C of the User-Flows-Details Sheet. The skill resolves this list at runtime per `references/sheet-interop.md` §4 — there is no hardcoded list.

- [ ] **Step 2: Rewrite Phase 0 step 4 (line 43–47 area)**

Replace the literal `{studio, skill-builder, domain-cicd, migration-utility}` membership check with:

> Parse `git remote get-url origin` to extract the repo name (everything after the last `/`, stripping `.git`). Run the resolver from `references/sheet-interop.md` §4 to fetch the unique non-empty values in Sheet column C; cache that set for the rest of the invocation. Trim and case-fold both sides before comparing. If the current repo is not in the resolved set, abort with:
>
> > Current repo `<current-repo>` is not listed in Sheet column C. Legitimate options (from the Sheet): `<comma-separated-resolved-list>`. Re-run from one of those, or add a row to the Sheet first.
>
> If the resolver returns zero values, abort with:
>
> > Sheet column C is empty or has drifted. Verify the User-Flows-Details schema before retrying.

- [ ] **Step 3: Update Phase 3 (Verify repo alignment) to reuse the cache**

Phase 3 today re-derives the comparison from the row's column C. Add an explicit note: "Use the cached repo set from Phase 0 — do not re-fetch." (Behavior unchanged; this is a guardrail against future drift.)

- [ ] **Step 4: Update the Safety rails item (line 215 area)**

Replace:

> Running outside the four target repos.

With:

> Running outside any repo listed in Sheet column C of the User-Flows-Details Sheet.

- [ ] **Step 5: Update the References section**

Mention `references/sheet-interop.md` §4 explicitly as Phase 0's repo-set resolver, distinct from §1 (row fetch) and §2 (candidate listing).

---

## Task 3: Update the `/author-flow-spec` command shim

**Files:**

- Modify: `commands/author-flow-spec.md`

- [ ] **Step 1: Rewrite the "What this does" step 1**

Replace:

> Confirms `gws` is logged in and you are inside one of the four target repos (`studio`, `skill-builder`, `domain-cicd`, `migration-utility`).

With:

> Confirms `gws` is logged in and you are inside one of the target repos listed in column C of the User-Flows-Details Sheet (resolved at runtime — see the skill's `references/sheet-interop.md`).

---

## Task 4: De-hardcode the reference docs

**Files:**

- Modify: `skills/authoring-flow-spec/references/flow-spec-template.md`
- Modify: `skills/authoring-flow-spec/references/flow-spec-template-rationalization.md`

- [ ] **Step 1: `flow-spec-template.md` line 16**

Replace `(\`studio\`, \`skill-builder\`, \`domain-cicd\`, or \`migration-utility\`)` with `(per Sheet column C of the User-Flows-Details Sheet)`.

- [ ] **Step 2: `flow-spec-template.md` line 173**

Same replacement, in the prose explaining the canonical-ID-to-repo mapping.

- [ ] **Step 3: `flow-spec-template-rationalization.md` line 114**

Replace the literal four-name list with: "The `<target-repo>` is the value in Sheet column C. As of the time of writing, the active set is `studio`, `skill-builder`, `domain-cicd`, `migration-utility`, but this is non-normative — the Sheet is canonical and may change without a doc update."

The "as of the time of writing" caveat is allowed because this is the rationalization doc, which captures historical decisions, not behavior contracts.

---

## Task 5: Update the design spec to match

**Files:**

- Modify: `docs/design/2026-04-24-authoring-flow-spec-design.md`

- [ ] **Step 1: Lines 18–19 (architecture summary)**

Reframe the bullet to describe target repos as "the set in Sheet column C" rather than enumerating them.

- [ ] **Step 2: Lines 104–105 (ASCII diagram)**

Replace the literal four-repo lane with a placeholder like `<repos from Sheet col C>` or "any repo in Sheet col C". Preserve the diagram structure.

- [ ] **Step 3: Line 220 (Phase 0 procedure description)**

Update the prose around the membership check to describe the dynamic resolver, the once-per-invocation cache, and the case/whitespace handling. Cite `references/sheet-interop.md` §4 as the implementation surface.

- [ ] **Step 4: Line 481 (column-C nuance)**

The existing language about `#N/A`/blank guards on column C should be lightly revised so it now also covers the resolver's filter rules (the Phase 0 abort and the per-row Phase 2 use are aligned).

- [ ] **Step 5: Lines 526–527 (workflow summary)**

Replace the four-repo enumeration with a Sheet-pointer phrasing, consistent with Steps 1–3.

- [ ] **Step 6: Lines 566 and 692**

Same treatment — narrative references that named individual repos as part of "the four" should be reframed against Sheet column C, or simply use the specific repo name without the "one of four" framing.

- [ ] **Step 7: Add a short "Sheet-driven repo set" sub-section**

Add 5–10 lines to the design spec that codify (a) the cache scope, (b) the empty-Sheet abort, (c) the case-insensitive trimmed compare, (d) why the Sheet is the single source of truth, and (e) why this preserves the safety guarantees the previous hardcoded list provided. Cite this plan file by name.

---

## Task 6: Reconcile the historical plan file

**Files:**

- Modify: `docs/plan/2026-04-24-authoring-flow-spec.md`

- [ ] **Step 1: Update prose-level references**

Walk lines 274–275, 766, 783, 974, 1058–1059, 1594–1595 (and any other surviving four-repo references discovered via `grep -n` during execution). Each occurrence should be reframed to describe Sheet column C as canonical, or — where the line is a literal block of skill content shipped into the new SKILL.md — replaced with the new wording defined in Task 2.

- [ ] **Step 2: Add a closing "Superseded by" pointer**

At the top of the file, add a one-line note: *"Superseded in part by `docs/plan/2026-04-28-sheet-driven-target-repos.md` (Task 6 of this plan rewrites the Phase 0 repo whitelist to be Sheet-driven)."* This preserves the historical record without leaving readers with the impression that the four-repo whitelist is still authoritative.

---

## Task 7: Extend the eval coverage

**Files:**

- Modify: `tests/evals/prompts/skill-authoring-flow-spec.txt`
- Modify: `tests/evals/packages/authoring-flow-spec/skill-authoring-flow-spec.yaml`

- [ ] **Step 1: Add new boolean keys to the prompt JSON schema**

Add the following keys to the JSON output template in the prompt file:

```json
"resolves_target_repos_from_sheet_column_c": <bool>,
"caches_repo_set_for_invocation": <bool>,
"compares_repo_names_case_insensitive_trimmed": <bool>,
"aborts_on_empty_sheet_repo_set": <bool>,
"abort_message_lists_dynamic_repo_set": <bool>,
"does_not_hardcode_repo_whitelist": <bool>,
```

These six keys cover: dynamic resolution, single-fetch caching, comparison semantics, empty-Sheet abort, dynamic abort message, and absence of hardcoded enumeration.

- [ ] **Step 2: Extend the existing preconditions test**

In the YAML, add the new vars to the first existing preconditions test (`"preconditions — validates tooling, auth, git checkout, and allowed repo"`):

```yaml
expect_resolves_target_repos_from_sheet_column_c: "true"
expect_caches_repo_set_for_invocation: "true"
expect_compares_repo_names_case_insensitive_trimmed: "true"
expect_does_not_hardcode_repo_whitelist: "true"
```

- [ ] **Step 3: Add a new dedicated scenario for the abort paths**

Append a new test case to the YAML:

```yaml
- description: "preconditions — sheet-driven repo resolver covers empty-Sheet abort and dynamic abort messaging"
  vars:
    eval_type: user-behavior
    failure_modes: "missing-preconditions,wrong-source-of-truth,implementation-level-spec,premature-closeout"
    scenario: |-
      - The user runs the skill from inside a repo whose name is not present in Sheet column C.
      - In a separate run, Sheet column C is empty or every value is filtered out (#N/A, blank, or `pending repo assignment`).
      - In a third run, Sheet column C has the value `Studio   ` (extra trailing whitespace, mixed case) and the user is inside a repo whose `git remote` reports `studio`.
    expect_aborts_on_empty_sheet_repo_set: "true"
    expect_abort_message_lists_dynamic_repo_set: "true"
    expect_compares_repo_names_case_insensitive_trimmed: "true"
    expect_does_not_hardcode_repo_whitelist: "true"
```

- [ ] **Step 4: Confirm the assertion file needs no change**

`tests/evals/assertions/check-authoring-flow-spec-contract.js` already iterates every `expect_<key>` var and compares against the matching JSON output key. Verify by reading; no code change is expected. If a code change *is* needed (for example to allow `notes`-aware matching), keep it minimal and add a targeted unit test.

- [ ] **Step 5: Run the targeted skill eval**

Run only this skill's eval package locally:

```bash
cd tests/evals && npx promptfoo eval --config packages/authoring-flow-spec/skill-authoring-flow-spec.yaml
```

Confirm all scenarios — old and new — pass against the updated SKILL.md. Iterate on the SKILL.md wording if the model output drifts on any of the new keys.

---

## Task 8: Repo-wide gates and metadata

**Files:**

- Modify: `repo-map.json` (only if the skill's structural description meaningfully changed)
- Modify: `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` (version bump)

- [ ] **Step 1: Bump plugin manifest versions together**

Per `AGENTS.md`, both manifest versions must move in lockstep. Use a patch bump (e.g., `0.1.0 → 0.1.1`) since this is a behavior fix, not a new skill.

- [ ] **Step 2: Run the repo-wide deterministic eval gates**

```bash
npm run eval:coverage
npm run eval:codex-compatibility
npm run validate:plugin-manifests
```

All three must exit zero before opening a PR.

- [ ] **Step 3: Markdownlint every changed `.md`**

```bash
markdownlint \
  skills/authoring-flow-spec/SKILL.md \
  skills/authoring-flow-spec/references/sheet-interop.md \
  skills/authoring-flow-spec/references/flow-spec-template.md \
  skills/authoring-flow-spec/references/flow-spec-template-rationalization.md \
  commands/author-flow-spec.md \
  docs/design/2026-04-24-authoring-flow-spec-design.md \
  docs/plan/2026-04-24-authoring-flow-spec.md \
  docs/plan/2026-04-28-sheet-driven-target-repos.md
```

- [ ] **Step 4: Update `repo-map.json` if needed**

If the skill description in `repo-map.json` mentions the four-repo whitelist (likely it does not, but verify), update it. Otherwise no change.

---

## Task 9: Manual integration sanity check

**Files:** none

- [ ] **Step 1: Live-fetch column C and confirm the resolver works**

From the repo root, run the §4 recipe with the actual Sheet ID and confirm the output is the current set of target repos with no `#N/A`, blanks, or `pending …` rows.

- [ ] **Step 2: Spot-check from a non-target repo**

`cd` into any repo whose name is **not** in Sheet column C (e.g., this very plugin repo, since `engineering-skills` is not a target repo). Mentally walk the SKILL.md Phase 0 with the resolver output in hand and confirm the abort path lists the dynamic set rather than the old four.

- [ ] **Step 3: Spot-check from a target repo**

`cd` into a clone of a known target repo (e.g., `studio`). Mentally walk Phase 0 → Phase 2 → Phase 3 with a real canonical ID and confirm the cache is reused at Phase 3 and that the row's column C value matches the cached set.

These checks are eyeball-only — no skill invocation, no file writes — because the runtime side effects are validated separately by the eval suite in Task 7.

---

## Task 10: PR

**Files:** none

- [ ] **Step 1: Confirm clean working tree, branch ahead of origin/main only by the planned commits**

```bash
git status
git log --oneline origin/main..HEAD
```

- [ ] **Step 2: Open the PR via the `engineering-skills:raising-linear-pr` skill**

Per repo conventions, every PR is paired with a Linear issue in the **Internal-IT** project. Hand off to `engineering-skills:raising-linear-pr` once Tasks 1–9 are complete and verified. Title suggestion: *"authoring-flow-spec: resolve target repos from Sheet column C, drop hardcoded whitelist."*

- [ ] **Step 3: PR description hits the four points**

The PR body should explicitly describe:

1. The single-source-of-truth shift (Sheet column C only).
2. The three confirmed semantics (cache once, hard-abort on empty, case-insensitive trimmed compare).
3. The eval additions (six new boolean keys, one new scenario, one extended scenario).
4. A pointer to this plan file as the source design.

---

## Out of Scope

- Adding a Sheet-write path. The skill remains read-only against the Sheet.
- Re-architecting the Sheet schema (column ordering, new columns). Any schema change is a separate plan.
- Migrating archived flows. Each migration is still a separate skill invocation, per the historical plan.
- Touching other skills that may also enumerate the four repos (e.g., status-update commands in `vd-specs-product-architecture`). Those live outside this plugin repo and are handled by their owning repo.
